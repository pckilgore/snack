import deepObjectDiff from 'deep-object-diff';
import QRCode from 'qrcode.react';
import React, { useState, useEffect } from 'react';
// Snowpack has an issue importing named exports from commonjs modules11
import SnackNamespace from 'snack-sdk';
const { Snack, getSupportedSDKVersions } = SnackNamespace;

import { Button, Toolbar } from './Components';
import { INITIAL_CODE } from './Defaults';

const { diff } = deepObjectDiff;

const INITIAL_CODE_CHANGES_DELAY = 500;

function App() {
  const [snack] = useState(
    () =>
      new Snack({
        codeChangesDelay: INITIAL_CODE_CHANGES_DELAY,
        files: {
          'App.js': {
            type: 'CODE',
            contents: INITIAL_CODE,
          },
        },
      }),
  );
  const [snackState, setSnackState] = useState(snack.getState());
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [codeChangesDelay, setCodeChangesDelay] = useState(
    INITIAL_CODE_CHANGES_DELAY,
  );

  // Listen for state changes and log messages
  useEffect(() => {
    const listeners = [
      snack.addStateListener((state, prevState) => {
        console.log('State changed: ', diff(prevState, state));
        setSnackState(state);
      }),
      snack.addLogListener(({ message }) => console.log(message)),
    ];
    return () => listeners.forEach((listener) => listener());
  }, [snack]);

  // Render
  const {
    files,
    url,
    deviceId,
    online,
    onlineName,
    connectedClients,
    name,
    description,
    sdkVersion,
  } = snackState;
  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <Toolbar title="Code" />
        <textarea
          style={styles.code}
          value={files['App.js'].contents}
          onChange={(event) =>
            snack.updateFiles({
              'App.js': {
                type: 'CODE',
                contents: event.target.value,
              },
            })
          }
        />
        <p>Open the Developer Console of your Browser to view logs.</p>
      </div>
      <div style={styles.right}>
        <div style={styles.settingsContainer}>
          <Toolbar>
            <Button
              style={{ marginRight: 10 }}
              label="Save"
              loading={isSaving}
              onClick={async () => {
                console.log('Saving...');
                setIsSaving(true);
                try {
                  const { id } = await snack.saveAsync();
                  console.log(`Saved with id ${id}`);
                } catch (err) {
                  console.error('Save failed', err);
                }
                setIsSaving(false);
              }}
            />
            <Button
              label="Download"
              loading={isDownloading}
              onClick={async () => {
                console.log('Getting download URL...');
                setIsDownloading(true);
                try {
                  const url = await snack.getDownloadURLAsync();
                  console.log(`Download URL: ${url}, starting download...`);
                } catch (err) {
                  console.error('Get download URL failed', err);
                }
                setIsDownloading(false);
              }}
            />
          </Toolbar>
          <div style={styles.settingsContent}>
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => snack.setName(event.target.value)}
            />
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(event) => snack.setDescription(event.target.value)}
            />
            <label>SDK Version</label>
            <select
              value={sdkVersion}
              onChange={(event) => snack.setSDKVersion(event.target.value)}
            >
              {getSupportedSDKVersions().map((ver) => (
                <option key={ver} value={ver}>
                  {ver}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.onlineContainer}>
          <Toolbar title="Connections">
            <Button
              label={online ? 'Go Offline' : 'Go Online'}
              onClick={() => snack.setOnline(!online)}
            />
          </Toolbar>
          <div style={styles.onlineContent}>
            <label>Device Id</label>
            <input
              type="text"
              placeholder="xxxx-xxxx"
              value={deviceId}
              onChange={(event) => snack.setDeviceId(event.target.value)}
            />
            <label>Send Code changes automatically</label>
            <select
              value={codeChangesDelay}
              onChange={(event) => {
                snack.setCodeChangesDelay(Number(event.target.value));
                setCodeChangesDelay(Number(event.target.value));
              }}
            >
              <option value={-1}>Disabled (-1)</option>
              <option value={0}>Immediately (0)</option>
              <option value={500}>Debounced (after 500ms)</option>
            </select>
            {codeChangesDelay === -1 ? (
              <Button
                label="Send Code changes"
                onClick={() => snack.sendCodeChanges()}
              />
            ) : undefined}
            <label>{`Status: ${online ? 'Online' : 'Offline'}`}</label>
            {online ? (
              <QRCode style={styles.qrcode} value={url} />
            ) : undefined}
            {online ? <a href={url}>{url}</a> : undefined}
            {online ? (
              <label>{`Online name: ${onlineName}`}</label>
            ) : undefined}
            {online ? (
              <label>{`${
                Object.keys(connectedClients).length
              } connected client(s)`}</label>
            ) : undefined}
          </div>
        </div>
      </div>
    </div>
  );
}

const sharedStyles = {
  pane: {
    border: '1px solid #DDDDE1',
    borderRadius: 4,
  },
};

const styles = {
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    padding: 20,
  },
  left: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    width: 300,
    marginLeft: 20,
  },
  code: {
    display: 'flex',
    flex: 1,
    ...sharedStyles.pane,
  },
  settingsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  settingsContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
    ...sharedStyles.pane,
  },
  onlineContainer: {
    display: 'flex',
    flex: 1,
    marginTop: 20,
    flexDirection: 'column',
  },
  onlineContent: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    padding: 20,
    ...sharedStyles.pane,
  },
  qrcode: {
    width: 260,
    height: 260,
    marginBottom: 20,
  },
  offline: {
    flex: 1,
    alignSelf: 'center',
    opacity: 0.5,
  },
};

export default App;
