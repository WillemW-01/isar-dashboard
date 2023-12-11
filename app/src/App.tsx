import { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import "./App.css";
import GraphSquare from "./components/GraphSquare";

import downloadIcon from "./assets/download.png";
import isarLogo from "./assets/logo.png";
import spinner from "./assets/logo_3.png";
import spacecraft from "./assets/sattelite.png";

const App = () => {
  // this interface was necessary for correct annotation of the first 3 state variables
  interface DataPoint {
    name: string;
    value: any;
  }

  // state variables for storing the data coming from the server
  const [velocity, setVelocity] = useState<DataPoint[]>([]);
  const [altitude, setAltitude] = useState<DataPoint[]>([]);
  const [temperature, setTemperature] = useState<DataPoint[]>([]);
  const [isAscending, setIsAscending] = useState(false);
  const [statusText, setStatusText] = useState("Nothing to report.");

  // custom variables for other state management
  const [lastUpdate, setLastUpdate] = useState("--:--:--");
  const [missionTime, setMissionTime] = useState("");
  const [updateButtonDisabled, setUpdateButtonDisabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spinnerActive, setSpinnerActive] = useState(false);
  const [socketOpen, setSocketOpen] = useState(false);
  const [actionText, setActionText] = useState("Correct steering");
  const socket = useRef<WebSocket>();

  // constants that need not be changed via hooks
  const MISSION_START = new Date(
    2023,
    new Date().getMonth(),
    new Date().getDate() - 1
  );
  const ASCENDING_TEXT = ["not ascending", "ascending"];
  const ROTATION_VALUES = [45, 15];
  const SPINNER_STYLE = [{ display: "none" }, { display: "block" }];
  const LAST_NUM_POINTS = 30;
  const ACTION_TEXT_LIST = [
    "Correct steering",
    "Update sensor position",
    "Restablish communication",
    "Check unexpected altitude",
    "Decode broken message bytes",
  ];
  const API_URL =
    "https://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumStatus";
  const SOCKET_URL =
    "wss://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumWS";
  const ACTION_URL =
    "https://webfrontendassignment-isaraerospace.azurewebsites.net/api/ActOnSpectrum";

  /****************************************************************************
   * UTILITY FUNCTIONS
   ****************************************************************************/

  const getLastValue = (obj: DataPoint[]): string => {
    if (obj.length == 0) {
      return "";
    } else {
      return `${obj[obj.length - 1].value.toFixed(2)}`;
    }
  };

  const getMaxValue = (obj: DataPoint[]): string => {
    if (obj.length == 0) {
      return "";
    } else {
      return Math.max(...obj.map((entry) => entry.value)).toFixed(2);
    }
  };

  const getMinValue = (obj: DataPoint[]): string => {
    if (obj.length == 0) {
      return "";
    } else {
      return Math.min(...obj.map((entry) => entry.value)).toFixed(2);
    }
  };

  const getRandomText = (): string => {
    return ACTION_TEXT_LIST[
      Math.floor(Math.random() * ACTION_TEXT_LIST.length)
    ];
  };

  const generateObj = (timeStamp: string, value: Number) => {
    return { name: timeStamp, value: Number(value.toFixed(2)) };
  };

  const getTimeStamp = () => {
    let now = new Date();
    return `${now.toLocaleTimeString()}`;
  };

  // this function converts all the keys of the data object to lowercase such
  // that it is consistent.
  const getConsistentData = (data: { [key: string]: any }) => {
    let keys = Object.keys(data);
    let newData: { [key: string]: any } = {};
    keys.forEach((key) => {
      newData[key.toLowerCase()] = data[key];
    });
    return newData;
  };

  /****************************************************************************
   * API FUNCTIONS
   ****************************************************************************/

  // this function fetches the data from the first API endpoint and updates
  // the state variables with the response.
  const fetchFromUrl = () => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        let timeStamp = getTimeStamp();
        const newData = getConsistentData(data);
        updateValues(timeStamp, newData);
      })
      .catch((error) => console.log(error));
  };

  // this function allows the user to "act" on the spacecraft via the endpoint
  // given, although no response is given. An artificial timeout was given so that
  // it feels like something is being done.
  const takeAction = () => {
    fetch(ACTION_URL).then((response) => {
      setSpinnerActive(true);
      setTimeout(() => {
        console.log(`Action taken! Response: ${response}`);
        setSpinnerActive(false);
        setIsModalOpen(false);
        setActionText(() => getRandomText());
      }, 1500);
    });
  };

  // this function allows the user to download the sensor data received from the server
  // up until that point in csv format.
  const downloadData = () => {
    // source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
    let csvContent = "timeStamp,altitude,velocity,temperature\n";
    for (let i = 0; i < altitude.length; i++) {
      csvContent += `${altitude[i].name},${altitude[i].value},${velocity[i].value},${temperature[i].value}\n`;
    }
    let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    let url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "data.csv");
    link.click();
  };

  // This function updates the state of lists containing the sensor data
  const updateValues = (timeStamp: string, data: any) => {
    setLastUpdate(timeStamp);
    setVelocity((prevVelocity) =>
      prevVelocity.concat(generateObj(timeStamp, data["velocity"]))
    );
    setAltitude((prevAltitude) =>
      prevAltitude.concat(generateObj(timeStamp, data["altitude"]))
    );
    setTemperature((prevTemperature) =>
      prevTemperature.concat(generateObj(timeStamp, data["temperature"]))
    );
    setIsAscending(data["isascending"]);
    setStatusText(data["statusmessage"]);

    // only run this when the data is streamed (assignment B)
    if (data["isactionrequired"] && socketOpen) {
      setIsModalOpen(true);
    }
  };

  /****************************************************************************
   * HOOKS
   ****************************************************************************/

  // this hook simply increments the time since the mission start time.
  // it also calculates the hours from a previous day if necessary.
  useEffect(() => {
    const timer = setInterval(() => {
      let now = new Date();
      const elapsedHours =
        now.getHours() -
        MISSION_START.getHours() +
        (now.getDate() - MISSION_START.getDate()) * 24;
      const elapsedMinutes = now.getMinutes() - MISSION_START.getMinutes();
      const elapsedSeconds = now.getSeconds() - MISSION_START.getSeconds();
      let elapsed = {
        hours: String(elapsedHours).padStart(2, "0"),
        minutes: String(elapsedMinutes).padStart(2, "0"),
        seconds: String(elapsedSeconds).padStart(2, "0"),
      };
      setMissionTime(
        `${elapsed["hours"]}:${elapsed["minutes"]}:${elapsed["seconds"]}`
      ),
        1000;
    });

    return () => {
      clearInterval(timer);
    };
  }, [missionTime]);

  // this function creates the WebSocket only once when the application is first rendered, and
  // will attempt to reconnect once the connection is lost or an error occurred.
  useEffect(() => {
    socket.current = new WebSocket(SOCKET_URL);
    socket.current.onopen = () => console.log("Socket is opened");
    socket.current.onclose = () => {
      console.log("Socket was closed");
      setTimeout(() => (socket.current = new WebSocket(SOCKET_URL)), 1000);
    };
    socket.current.onerror = () => {
      console.log("Socket had an error");
      setTimeout(() => (socket.current = new WebSocket(SOCKET_URL)), 1000);
    };

    const tempSocket = socket.current;
    return () => {
      console.log("Socket is closing");

      tempSocket.close();
    };
  }, []);

  // this hook will attempt to retrieve a message from the server as soon as one
  // is available, and will then update the state values from the response.
  useEffect(() => {
    if (!socket.current) return;
    socket.current.onmessage = (event) => {
      if (!socketOpen) return;
      console.log(event.data);

      const newData = getConsistentData(JSON.parse(event.data));
      const timeStamp = getTimeStamp();
      updateValues(timeStamp, newData);
    };
  }, [socketOpen]);

  /****************************************************************************
   * JSX
   ****************************************************************************/

  return (
    <>
      <div className="titleContainer">
        <div className="logoContainer">
          <img src={isarLogo} height="75px" />
          <div>
            <b>SPECTRUM LAUNCH</b>
          </div>
        </div>
        <div className="timerContainer">
          <div>
            <b>MISSION CLOCK:</b> {missionTime}
          </div>
          <div>
            <b>LAST UPDATE:</b> {lastUpdate}
          </div>
        </div>
      </div>
      <div className="dataContainer">
        <Modal isOpen={isModalOpen} className="modalActionRequired">
          <div className="modalButtonContainer">
            <div className="modalText">The spacecraft requires action</div>
            <button onMouseDown={takeAction} disabled={spinnerActive}>
              {actionText}
            </button>
          </div>
          <img
            className="spinner"
            src={spinner}
            style={SPINNER_STYLE[Number(spinnerActive)]}
          />
        </Modal>
        <div className="graphContainer">
          <div className="graphAltitude graphBox">
            <GraphSquare
              data={altitude.slice(-LAST_NUM_POINTS)}
              label="Altitude"
              value={getLastValue(altitude)}
              min={getMinValue(altitude)}
              max={getMaxValue(altitude)}
              unit="m"
            />
          </div>
          <div className="graphTemperature graphBox">
            <GraphSquare
              data={temperature.slice(-20)}
              label="Temperature"
              value={getLastValue(temperature)}
              min={Number(getMinValue(temperature))}
              max={Number(getMaxValue(temperature))}
              unit="C"
            />
          </div>
        </div>
        <div className="graphContainer">
          <div className="graphVelocity graphBox">
            <GraphSquare
              data={velocity.slice(-LAST_NUM_POINTS)}
              label="Velocity"
              value={getLastValue(velocity)}
              min={getMinValue(velocity)}
              max={getMaxValue(velocity)}
              unit="m/s"
            />
          </div>

          <div className="infoContainer graphBox">
            <div className="statusText">{statusText}</div>
            <div className="buttonContainer">
              <button
                disabled={updateButtonDisabled}
                onMouseDown={fetchFromUrl}
              >
                Update
              </button>
              {updateButtonDisabled ? (
                <button
                  onMouseDown={() => {
                    setSocketOpen(false);
                    setUpdateButtonDisabled(false);
                  }}
                >
                  Stop
                </button>
              ) : (
                <button
                  onMouseDown={() => {
                    setSocketOpen(true);
                    setUpdateButtonDisabled(true);
                  }}
                >
                  Stream
                </button>
              )}
              <button
                className="downloadButton"
                onMouseDown={(event) => {
                  if (event.buttons == 1) downloadData();
                }}
              >
                <img src={downloadIcon} />
              </button>
            </div>
            <div className="summaryInfo">
              <table>
                <tr>
                  <td></td>
                  <td>
                    <b>Current</b>
                  </td>
                  <td>
                    <b>Min</b>
                  </td>
                  <td>
                    <b>Max</b>
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Altitude</b>
                  </td>
                  <td>{altitude.length != 0 ? getLastValue(altitude) : "-"}</td>
                  <td>{getMaxValue(altitude)}</td>
                  <td>{getMinValue(altitude)}</td>
                </tr>
                <tr>
                  <td>
                    <b>Velocity</b>
                  </td>
                  <td>{velocity.length != 0 ? getLastValue(velocity) : "-"}</td>
                  <td>{getMaxValue(velocity)}</td>
                  <td>{getMinValue(velocity)}</td>
                </tr>
                <tr>
                  <td>
                    <b>Temperature</b>
                  </td>
                  <td>
                    {temperature.length != 0 ? getLastValue(temperature) : "-"}
                  </td>
                  <td>{getMaxValue(temperature)}</td>
                  <td>{getMinValue(temperature)}</td>
                </tr>
              </table>
              <div className="imageContainer">
                <b>Ascending status:</b> {ASCENDING_TEXT[Number(isAscending)]}
                <img
                  className="spaceImg"
                  src={spacecraft}
                  style={{
                    transform: `rotate(${
                      ROTATION_VALUES[Number(isAscending)]
                    }deg)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
