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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [fileLink, setFileLink] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [sections, setSections] = useState([]);
  const transcriptFileInputRef = useRef(null);
  const summaryFileInputRef = useRef(null);
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
  async function transcribeAudio(audio, language, type) {
    const summaryChapters = await audioToText(audio, language, type);

    if (!summaryChapters) return;
    setMeetingTitle(
      summaryChapters[0]?.gist ||
        summaryChapters[0]?.headline ||
        "Transcription of Meeting"
    );

    let newSections = [];
    if (type === "transcript") {
      console.log(type);
      newSections.push(<TranscriptSection key={1} text={summaryChapters} />);
    }
    if (type === "summary") {
      newSections = summaryChapters.map((chapter, index) => (
        <Section
          key={index}
          details={{
            title: index === 0 ? "Introduction" : chapter.headline,
            description: chapter.summary,
          }}
        />
      ));
    }
    setSections(newSections);
    setConverted(true);

    // console.log(uploaded);
    setUploaded(true);
    // console.log(uploaded);

    setDisableDownload(false);
  }

  function handleButtonClick() {
    transcriptFileInputRef.current.click();
  }

  async function handleFileChange(event) {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    console.log(selectedFile);
    setUploaded(false);
    transcribeAudio(selectedFile, language, "transcript");
  }

  function handleSummaryButtonClick() {
    summaryFileInputRef.current.click();
  }
  async function handleSummaryFileChange(event) {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    console.log(selectedFile);
    setUploaded(false);
    transcribeAudio(selectedFile, language, "summary");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // console.log(e);
    setConverted(false);
    // transcribeAudio(fileLink);
  }
  function handleTranscibeButton() {
    transcribeAudio(fileLink, language, "transcript");
  }
  function handleSummaryButton() {
    transcribeAudio(fileLink, language, "summary");
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
          hasSummary: section.props.details ? true : false,
          title: section.props?.details?.title,
          description: section.props?.details?.description,
          hasText: section.props.text ? true : false,
          text: section.props.text || null,
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
  async function getPermissionsOnChange(e) {
    setLanguage(e.target.value);
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
            transcribeAudio(audioFile, language, "transcript");
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
        <div className="menu-icon" onClick={() => setIsMenuOpen((v) => !v)}>
          <img
            src="icons8-hamburger-menu.svg"
            alt="menu-logo"
            className="menu-logo"
          />
        </div>

        <div
          className="options"
          style={{
            display: `${isMenuOpen ? "block" : "none"}`,
          }}
        >
          <div className="language">
            <img src="mic.png" alt="logo" />
            <select
              name="input-language"
              id="language"
              value={language}
              onChange={getPermissionsOnChange}
            >
              <option value={"system"}>System Audio</option>
              {languages.map((language) => (
                <option value={language.code} key={language.no}>
                  {language.name}
                </option>
              ))}
            </select>

            <div className="record-btn">
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
              transcribeAudio(audioObj, language, "transcript");
            }}
          />

          <div className="upload-section">
            <input
              type="file"
              accept="audio/*,video/*"
              ref={transcriptFileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <img src="file.png" alt="logo" />
            <button
              className="btn audio-file-to-text"
              onClick={handleButtonClick}
            >
              <p>
                {uploaded
                  ? "Upload MP3/MP4 File to get transcript"
                  : "Uploading..."}
              </p>
            </button>
            <input
              type="file"
              accept="audio/*,video/*"
              ref={summaryFileInputRef}
              style={{ display: "none" }}
              onChange={handleSummaryFileChange}
            />
            <img src="file.png" alt="logo" />
            <button
              className="btn audio-file-to-text"
              onClick={handleSummaryButtonClick}
            >
              <p>
                {uploaded
                  ? "Upload MP3/MP4 File to get summary"
                  : "Uploading..."}
              </p>
            </button>
          </div>
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
        <h1 className="notes-header-title">MIDYAI SPEECH-TO-TEXT</h1>
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
          What Note will we take today?
        </h2>
        {sections.length === 0 ? (
          <div className="important-note">
            <h3>Dear User,</h3>
            <p className="audio-time-note">
              Please record atleast 50 seconds so that the audio system can
              recognize the language.
            </p>
            <p>Languages available for transcription with audio system:</p>
            <ul>
              {languages
                .filter((language, index) => language.audioDetection)
                .map((language, index) => (
                  <li key={index}>{language.name}</li>
                ))}
            </ul>
          </div>
        ) : (
          <div className="meeting-details">
            {meetingTitle ? <h2>Meeting Summary: {meetingTitle}</h2> : ""}
            {sections}
          </div>
        )}
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

const TranscriptSection = function ({ text }) {
  return (
    <div className="section-details">
      <p>{text}</p>
    </div>
  );
};

export default App;
