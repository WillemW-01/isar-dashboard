import { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import "./App.css";
import GraphSquare from "./components/GraphSquare";

import spacecraft from "./assets/sattelite.png";
import isarLogo from "./assets/logo.png";
import spinner from "./assets/logo_3.png";

const App = () => {
  interface DataPoint {
    name: string;
    value: any;
  }

  // TODO: do correct HTTP upgrading
  // TODO: Y axis of graphs must save min and max
  // TODO: make labels of X axis of graphs smaller
  // TODO:

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
  const socket = useRef<WebSocket>();

  const missionStart = new Date(2023, 11, 10);
  const apiUrl =
    "https://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumStatus";
  const ascendingText = ["not ascending", "ascending"];
  const rotationValues = [45, 15];
  const spinnerStyle = [{ display: "none" }, { display: "block" }];
  const lastNumPoints = 40;

  const getLastValue = (obj: DataPoint[]) => {
    if (obj.length == 0) {
      return "";
    } else {
      return `${obj[obj.length - 1].value.toFixed(2)}`;
    }
  };

  const getMaxValue = (obj: DataPoint[]) => {
    if (obj.length == 0) {
      return "";
    } else {
      return Math.max(...obj.map((entry) => entry.value)).toFixed(2);
    }
  };

  const getMinValue = (obj: DataPoint[]) => {
    if (obj.length == 0) {
      return "";
    } else {
      return Math.min(...obj.map((entry) => entry.value)).toFixed(2);
    }
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
    console.log(data);

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

    if (data["isactionrequired"]) {
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    socket.current = new WebSocket(
      "wss://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumWS"
    );
    socket.current.onopen = () => console.log("Socket is opened");
    socket.current.onclose = () => console.log("Socket is opened");

    const tempSocket = socket.current;
    return () => {
      tempSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket.current) return;
    if (!updateButtonDisabled && socketOpen) {
      setUpdateButtonDisabled(true);
    }
    if (updateButtonDisabled && !socketOpen) {
      setUpdateButtonDisabled(false);
    }
    socket.current.onmessage = (event) => {
      if (!socketOpen) return;
      console.log(`updateButton: ${updateButtonDisabled}`);

      const newData = getConsistentData(JSON.parse(event.data));
      const timeStamp = getTimeStamp();
      updateValues(timeStamp, newData);
    };
  }, [socketOpen]);

  const takeAction = () => {
    fetch(
      "https://webfrontendassignment-isaraerospace.azurewebsites.net/api/ActOnSpectrum"
    ).then(() => {
      setSpinnerActive(true);
      setTimeout(() => {
        console.log(`Action taken!`);
        setSpinnerActive(false);
        setIsModalOpen(false);
      }, 1500);
    });
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
              Take Action
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
              data={temperature.slice(-30)}
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
                onMouseDown={fetchFromUrl}
                disabled={updateButtonDisabled}
              >
                Update
              </button>
              {updateButtonDisabled ? (
                <button onMouseDown={() => setSocketOpen(false)}>Stop</button>
              ) : (
                <button onMouseDown={() => setSocketOpen(true)}>Stream</button>
              )}
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
