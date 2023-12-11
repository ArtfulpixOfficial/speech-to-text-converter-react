import { useState, useRef } from "react";
import { useReactMediaRecorder } from "react-media-recorder-2";
import "./App.css";
import languages from "./languages";
import audioToText from "./api.js";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";

function App() {
  const [fileLink, setFileLink] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [sections, setSections] = useState([]);
  const fileInputRef = useRef(null);
  const [language, setLanguage] = useState("system");
  const [recording, setRecording] = useState(false);
  const { startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder(
    { audio: true }
  );
  const [permissions, setPermissions] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState();
  const [disableDownload, setDisableDownload] = useState(true);
  const [converted, setConverted] = useState(true);
  const [uploaded, setUploaded] = useState(true);
  function loadFile(url, callback) {
    PizZipUtils.getBinaryContent(url, callback);
  }
  async function blobToAudio(mediaBlobUrl) {
    const audioBlob = await fetch(mediaBlobUrl).then((r) => r.blob());
    console.log(audioBlob);
    const audioFile = new File([audioBlob], "voice.wav", { type: "audio/wav" });
    return audioFile;
  }
  async function transcribeAudio(audio, language) {
    const summaryChapters = await audioToText(audio);
    if (!summaryChapters) return;
    setMeetingTitle(summaryChapters[0]?.gist || summaryChapters[0]?.headline);
    const newSections = summaryChapters.map((chapter, index) => (
      <Section
        key={index}
        details={{
          title: index === 0 ? "Introduction" : chapter.headline,
          description: chapter.summary,
        }}
      />
    ));
    setSections(newSections);
    if (!converted) {
      setConverted(true);
    }
    if (!uploaded) {
      setUploaded(true);
    }
    setDisableDownload(false);
  }

  function handleButtonClick() {
    fileInputRef.current.click();
  }

  async function handleFileChange(event) {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    console.log(selectedFile);
    setUploaded(false);
    transcribeAudio(selectedFile);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setConverted(false);
    transcribeAudio(fileLink);
  }

  async function handleDownload() {
    // Load the Word document template
    loadFile("/template.docx", async function (error, content) {
      if (error) {
        throw error;
      }

      // Create a new instance of Docxtemplater
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip);

      // Provide data to fill in the placeholders
      const data = {
        meetingTitle,
        notes: sections.map((section) => ({
          title: section.props.details.title,
          description: section.props.details.description,
        })),
      };

      // Replace placeholders with actual data
      doc.setData(data);

      // Process the template
      doc.render();

      // Save the generated document
      const outputBuffer = doc.getZip().generate({ type: "blob" });
      saveAs(outputBuffer, "meeting_notes.docx");
    });
  }

  async function handleRecordButton() {
    if (!permissions) {
      if (language === "system") {
        await navigator.mediaDevices
          .getDisplayMedia({
            audio: true,
          })
          .then((newStream) => setMediaRecorder(new MediaRecorder(newStream)));
      }
      setPermissions(true);
    } else if (permissions && !recording) {
      if (language === "system") {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            const audioBlob = new Blob([event.data], {
              type: "audio/wav",
            });
            const audioFile = new File([audioBlob], "recording.wav", {
              type: "audio/wav",
            });
            transcribeAudio(audioFile);
          }
        };
        mediaRecorder.start();
      } else {
        startRecording();
      }
      setRecording(true);
    } else {
      if (language === "system") {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      } else {
        stopRecording();
      }
      setRecording(false);
      setPermissions(false);
    }
  }
  return (
    <div className="main-container">
      <div className="container">
        <div className="options">
          <div className="header">
            <img src="logo.png" alt="logo" className="header-logo" />
            <h2 className="heading">MidyAI Notetaker</h2>
          </div>
          <div className="language">
            <select
              name="input-language"
              id="language"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
              }}
            >
              <option value={"system"}>System Audio</option>
              {languages.map((language) => (
                <option value={language.code} key={language.no}>
                  {language.name}
                </option>
              ))}
            </select>
            <div>
              <button
                className={`btn record ${
                  permissions && recording ? "recording" : ""
                }`}
                onClick={handleRecordButton}
              >
                <div className="icon">
                  <ion-icon name="mic-outline"></ion-icon>
                  <img src="bars.svg" alt="" />
                </div>
                <p>{`${
                  !permissions && !recording
                    ? "Get Permissions"
                    : permissions && !recording
                    ? "Start Listening"
                    : "Listening"
                } `}</p>
              </button>
            </div>
          </div>
          <audio
            src={mediaBlobUrl}
            onCanPlay={async () => {
              const audioObj = await blobToAudio(mediaBlobUrl);
              transcribeAudio(audioObj, language);
            }}
          />
          <form className="link-to-text" onSubmit={handleSubmit}>
            <input
              type="url"
              name="audio"
              id="audio-link"
              placeholder="https://www.example.com/demo-file.mp4"
              value={fileLink}
              onChange={(e) => {
                setFileLink(e.target.value);
              }}
            />
            <button className="btn convert">
              <p>{converted ? "Convert" : "Converting..."}</p>
            </button>
          </form>
          <input
            type="file"
            accept="audio/*,video/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            className="btn audio-file-to-text"
            onClick={handleButtonClick}
          >
            <div className="icon">
              <ion-icon name="cloud-upload-outline"></ion-icon>
            </div>
            <p>{uploaded ? "Upload a MP3/MP4 File" : "Uploading..."}</p>
          </button>
        </div>
      </div>
      <div className="notes">
        <div className="buttons">
          <button
            disabled={disableDownload}
            className="btn download"
            onClick={handleDownload}
          >
            <ion-icon name="cloud-download-outline"></ion-icon>
            <p>Download Note</p>
          </button>
          <img src="logo.png" alt="logo" className="logo" />
          <button
            className="btn clear"
            onClick={() => {
              setMeetingTitle("");
              setSections([]);
              setDisableDownload(true);
            }}
          >
            <ion-icon name="trash-outline"></ion-icon>
            <p>Clear Note</p>
          </button>
        </div>
        <h1 className="notes-header-title">What note will we take today?</h1>
        <div className="meeting-details">
          {meetingTitle ? <h2>Meeting Summary: {meetingTitle}</h2> : ""}
          {sections}
        </div>
      </div>
    </div>
  );
}

const Section = function ({ details }) {
  return (
    <div className="section-details">
      <h2>{details.title}:</h2>
      <p>{details.description}</p>
    </div>
  );
};

export default App;
