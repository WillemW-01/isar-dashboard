import { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import "./App.css";
import GraphSquare from "./components/GraphSquare";

import spacecraft from "./assets/sattelite.png";
import isarLogo from "./assets/logo.png";
import spinner from "./assets/logo_3.png";
import downloadIcon from "./assets/download.png";

const App = () => {
  interface DataPoint {
    name: string;
    value: any;
  }

  const [velocity, setVelocity] = useState<DataPoint[]>([]);
  const [altitude, setAltitude] = useState<DataPoint[]>([]);
  const [temperature, setTemperature] = useState<DataPoint[]>([]);
  const [isAscending, setIsAscending] = useState(false);
  const [statusText, setStatusText] = useState("Nothing to report.");
  const [lastUpdate, setLastUpdate] = useState("--:--:--");
  const [missionTime, setMissionTime] = useState("");
  const [updateButtonDisabled, setUpdateButtonDisabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spinnerActive, setSpinnerActive] = useState(false);
  const [socketOpen, setSocketOpen] = useState(false);
  const [actionText, setActionText] = useState("Correct steering");
  const socket = useRef<WebSocket>();

  const missionStart = new Date(
    2023,
    new Date().getMonth(),
    new Date().getDate() - 1
  );
  const ascendingText = ["not ascending", "ascending"];
  const rotationValues = [45, 15];
  const spinnerStyle = [{ display: "none" }, { display: "block" }];
  const lastNumPoints = 30;
  const actionTextList = [
    "Correct steering",
    "Update sensor position",
    "Restablish communication",
    "Check unexpected altitude",
    "Decode broken message bytes",
  ];
  const apiUrl =
    "https://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumStatus";
  const socketUrl =
    "wss://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumWS";
  const actionUrl =
    "https://webfrontendassignment-isaraerospace.azurewebsites.net/api/ActOnSpectrum";

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
    return actionTextList[Math.floor(Math.random() * actionTextList.length)];
  };

  useEffect(() => {
    const timer = setInterval(() => {
      let now = new Date();
      const elapsedHours =
        now.getHours() -
        missionStart.getHours() +
        (now.getDate() - missionStart.getDate()) * 24;
      const elapsedMinutes = now.getMinutes() - missionStart.getMinutes();
      const elapsedSeconds = now.getSeconds() - missionStart.getSeconds();
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

  const generateObj = (timeStamp: string, value: Number) => {
    return { name: timeStamp, value: Number(value.toFixed(2)) };
  };

  const getTimeStamp = () => {
    let now = new Date();
    return `${now.toLocaleTimeString()}`;
  };

  const getConsistentData = (data: { [key: string]: any }) => {
    let keys = Object.keys(data);
    let newData: { [key: string]: any } = {};
    keys.forEach((key) => {
      newData[key.toLowerCase()] = data[key];
    });
    return newData;
  };

  const fetchFromUrl = () => {
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        let timeStamp = getTimeStamp();
        const newData = getConsistentData(data);
        updateValues(timeStamp, newData);
      })
      .catch((error) => console.log(error));
  };

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

    if (data["isactionrequired"] && socketOpen) {
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    socket.current = new WebSocket(socketUrl);
    socket.current.onopen = () => console.log("Socket is opened");
    socket.current.onclose = () => {
      console.log("Socket was closed");
      setTimeout(() => (socket.current = new WebSocket(socketUrl)), 1000);
    };
    socket.current.onerror = () => {
      console.log("Socket had an error");
      setTimeout(() => (socket.current = new WebSocket(socketUrl)), 1000);
    };

    const tempSocket = socket.current;
    return () => {
      console.log("Socket is closing");

      tempSocket.close();
    };
  }, []);

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

  const takeAction = () => {
    fetch(actionUrl).then(() => {
      setSpinnerActive(true);
      setTimeout(() => {
        console.log(`Action taken!`);
        setSpinnerActive(false);
        setIsModalOpen(false);
        setActionText(() => getRandomText());
      }, 1500);
    });
  };

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
            style={spinnerStyle[Number(spinnerActive)]}
          />
        </Modal>
        <div className="graphContainer">
          <div className="graphAltitude graphBox">
            <GraphSquare
              data={altitude.slice(-lastNumPoints)}
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
              data={velocity.slice(-lastNumPoints)}
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
                <b>Ascending status:</b> {ascendingText[Number(isAscending)]}
                <img
                  className="spaceImg"
                  src={spacecraft}
                  style={{
                    transform: `rotate(${
                      rotationValues[Number(isAscending)]
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
