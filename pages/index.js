import * as _ from "lodash";
import React, { Component } from "react";
import { Connect, useConnect } from "@blockstack/connect";
import { UserSession, AppConfig } from "blockstack";
import { saveAs } from "file-saver";
import "../style/App.css";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

const authOptions = {
	redirectTo: "/",
	finished: ({ userSession }) => {
		console.log(userSession.loadUserData());
	},
	userSession,
	appDetails: {
		name: "Bin",
		icon: "https://helloblockstack.com/icon-192x192.png",
	},
};

const SignInButton = () => {
  const { doOpenAuth } = useConnect();

  return <button onClick={doOpenAuth}>Sign In</button>;
};

export default class App extends Component {
  constructor() {
    super();

		this.userSession = userSession;

    this.state = {
      user: {},
      text: "",
      files: [],
      file: null,
    };
  }

  async componentDidMount() {
    if (this.userSession.isUserSignedIn()) {
      const user = await this.userSession.loadUserData();
      this.setState({ user });
    } else if (this.userSession.isSignInPending()) {
      const user = await this.userSession.handlePendingSignIn();
      this.setState({ user });
    }

    if (Object.keys(this.state.user).length > 0) {
      this.fetchData();
    }
  }

  toAbsoluteURL(url) {
    const a = document.createElement("a");
    a.setAttribute("href", url);
    return a.cloneNode(false).href;
  }

  fetchText = async () => {
    console.log(this.userSession.store.getSessionData())
    try {
      const text = await this.userSession.getFile("text");
      this.setState({ text });
    } catch (err) {
      console.log(err);
    }
  }

  async fetchData() {
    if (this.state.user) {
      // try {
      //   const text = await this.userSession.getFile("text");
      //   this.setState({ text });
      // } catch (err) {
      //   console.log(err);
      // }

      await this.userSession.listFiles((file) => {
        if (file !== "text") {
          this.setState({ files: _.concat(this.state.files, file) });
          return true;
        }
      });
    } else {
      throw new Error("Not signed in");
    }
  }

  handleChangeText = (event) => {
    this.setState({ text: event.target.value });
  };

  uploadText = async (event) => {
    event.preventDefault();

    try {
      await this.userSession.putFile("text", this.state.text);
    } catch (err) {
      if (err.code === "precondition_failed_error") {
        alert(
          "This text has been changed since you last loaded it. You must reload this application before you can make changes to it."
        );
      }
    }
  };

  handleChooseFile = (event) => {
    this.setState({ file: event.target.files[0] });
  };

  uploadFile = async (event) => {
    event.preventDefault();

    try {
      await this.userSession.putFile(this.state.file.name, this.state.file);
    } catch (err) {
      console.log(err.code);
    }

    // Add filename to local application state
    this.setState({
      files: _.concat(this.state.files, this.state.file.name),
    });
  };

  deleteFile = async (index, fileName) => {
    await this.userSession.deleteFile(fileName);

    let files = _.clone(this.state.files);
    _.pullAt(files, [index]);

    this.setState({ files });
  };

  downloadFile = async (event) => {
    const fileName = event.target.text;
    const file = await this.userSession.getFile(fileName);
    const blob = new Blob([file]);
    saveAs(blob, fileName);
  };

  render() {
    return (
      <Connect authOptions={authOptions}>
        <div className="app">
          <div className="header">
            <h1 className="app-name">/bin</h1>

            {this.userSession.isUserSignedIn() && (
              <span className="logout">
                <>
                  <p>{this.state.user.username}</p>
                  <button
                    onClick={() =>
                      this.userSession.signUserOut(window.location.origin)
                    }
                  >
                    sign out
                  </button>
                </>
              </span>
            )}
          </div>

          {!this.userSession.isUserSignedIn() ? (
            <SignInButton></SignInButton>
          ) : (
            <div>
              <button onClick={this.fetchText}>load</button>
              <form onSubmit={this.uploadText}>
                <textarea
                  rows="1"
                  onChange={this.handleChangeText}
                  value={this.state.text}
                  placeholder="write something..."
                ></textarea>
                <button type="submit">save</button>
              </form>

              <h2>upload</h2>
              <form onSubmit={this.uploadFile}>
                <input type="file" onChange={this.handleChooseFile} />
                <br></br>
                <button type="submit">upload</button>
              </form>

              <h2>files</h2>
              <ul>
                {this.state.files.map((fileName, index) => {
                  return (
                    <li key={fileName}>
                      <span>
                        <a href="#" onClick={this.downloadFile}>
                          {fileName}
                        </a>
                      </span>
                      <span className="delete">
                        <a
                          href="#"
                          onClick={() => this.deleteFile(index, fileName)}
                        >
                          x
                        </a>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </Connect>
    );
  }
}
