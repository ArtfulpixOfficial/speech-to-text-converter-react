import { useState, useRef } from "react";
import "./App.css";
import languages from "./languages";
import audioToText from "./api.js";

function App() {
  const [fileLink, setFileLink] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [sections, setSections] = useState([]);

  const fileInputRef = useRef(null);

  const transcribeAudio = async function (audio) {
    const summaryChapters = await audioToText(audio);
    setMeetingTitle(summaryChapters[0]?.gist);
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
  };
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    transcribeAudio(selectedFile);
  };

  const handleSubmit = async function (e) {
    e.preventDefault();
    transcribeAudio(fileLink);
  };

  return (
    <div className="main-container">
      <div className="container">
        <div className="options">
          <div className="header">
            <img src="logo.png" alt="logo" className="header-logo" />
            <h2 className="heading">MidyAI Notetaker</h2>
          </div>
          <form className="language">
            <select name="input-language" id="language">
              <option value="system">System Audio</option>
              {languages.map((language) => (
                <option value={language.code} key={language.no}>
                  {language.name}
                </option>
              ))}
            </select>
            <button className="btn record">
              <div className="icon">
                <ion-icon name="mic-outline"></ion-icon>
                <img src="bars.svg" alt="" />
              </div>
              <p>Start Listening</p>
            </button>
          </form>
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
              <p>Convert</p>
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
            <p>Upload a MP3/MP4 File</p>
          </button>
        </div>
      </div>
      <div className="notes">
        <div className="buttons">
          <button className="btn download" disabled>
            <ion-icon name="cloud-download-outline"></ion-icon>
            <p>Download Note</p>
          </button>
          <img src="logo.png" alt="logo" className="logo" />
          <button className="btn clear">
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
