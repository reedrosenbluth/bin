import * as _ from "lodash";
import React, { Component } from "react";
import { UserSession, AppConfig } from "blockstack";
import { saveAs } from "file-saver";
import "../style/App.css";

export default class App extends Component {
  constructor() {
    super();

    const appConfig = new AppConfig(["store_write", "publish_data"]);
    this.userSession = new UserSession({ appConfig: appConfig });

    this.state = {
      user: {},
      text: "",
      files: [],
      file: null
    };
  }

  async componentDidMount() {
    if (this.userSession.isUserSignedIn()) {
      const user = this.userSession.loadUserData();
      this.setState({ user });
    } else if (this.userSession.isSignInPending()) {
      const user = await this.userSession.handlePendingSignIn();
      this.setState({ user });
    }

    if (this.state.user) {
      this.fetchData();
    }
  }

  async fetchData() {
    if (this.state.user) {
      const text = await this.userSession.getFile("text");
      if (text) {
        this.setState({ text });
      }

      await this.userSession.listFiles(file => {
        if (file !== "text") {
          this.setState({ files: _.concat(this.state.files, file) });
          return true;
        }
      });
    } else {
      throw new Error("Not signed in");
    }
  }

  handleChangeText = event => {
    this.setState({ text: event.target.value });
  };

  uploadText = async event => {
    event.preventDefault();
    await this.userSession.putFile("text", this.state.text);
  };

  handleChooseFile = event => {
    this.setState({ file: event.target.files[0] });
  };

  uploadFile = async event => {
    event.preventDefault();
    await this.userSession.putFile(this.state.file.name, this.state.file);

    // Add filename to local application state
    this.setState({
      files: _.concat(this.state.files, this.state.file.name)
    });
  };

  downloadFile = async event => {
    const fileName = event.target.text;
    const file = await this.userSession.getFile(fileName);
    const blob = new Blob([file]);
    saveAs(blob, fileName);
  };

  render() {
    return (
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
          <div className="login">
            <button onClick={() => this.userSession.redirectToSignIn()}>
              sign in
            </button>
          </div>
        ) : (
          <div>
            <form onSubmit={this.uploadText}>
              <textarea
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
            {this.state.files.map((value, index) => {
              return (
                <li key={value}>
                  <a href="#" onClick={this.downloadFile}>
                    {value}
                  </a>
                </li>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}
