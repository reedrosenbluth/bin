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

    this.fetchData();
  }

  async fetchData() {
    if (this.state.user) {
      await this.userSession.listFiles(file => {
        this.setState({ files: _.concat(this.state.files, file) });
        return true;
      });
    } else {
      throw new Error("Not signed in");
    }
  }

  handleChange = event => {
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
          <h1 className="app-name">bin</h1>

          <span className="login">
            {!this.userSession.isUserSignedIn() ? (
              <button onClick={() => this.userSession.redirectToSignIn()}>
                sign in
              </button>
            ) : (
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
            )}
          </span>
        </div>

        <h2>upload</h2>
        <form onSubmit={this.uploadFile}>
          <input type="file" onChange={this.handleChange} />
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
    );
  }
}
