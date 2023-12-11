import { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import "./App.css";
import GraphSquare from "./components/GraphSquare";

import spacecraft from "./assets/spacecraft.png";
import isarLogo from "./assets/logo.png";
import spinner from "./assets/logo_3.png";

const App = () => {
  interface DataPoint {
    name: string;
    value: any;
  }

  // TODO: do correct HTTP upgrading

  const [velocity, setVelocity] = useState<DataPoint[]>([]);
  const [altitude, setAltitude] = useState<DataPoint[]>([]);
  const [temperature, setTemperature] = useState<DataPoint[]>([]);
  const [isAscending, setIsAscending] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [lastUpdate, setLastUpdate] = useState("--:--:--");
  const [missionTime, setMissionTime] = useState("");
  const [updateButtonDisabled, setUpdateButtonDisabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spinnerActive, setSpinnerActive] = useState(false);
  const [socketOpen, setSocketOpen] = useState(false);
  const socket = useRef<WebSocket>();

  const missionStart = new Date(2023, 11, 1);
  const apiUrl =
    "https://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumStatus";
  const ascendingText = ["not ascending", "ascending"];
  const rotationValues = [45, 15];
  const spinnerStyle = [{ display: "none" }, { display: "block" }];

  const getLastValue = (obj: DataPoint[]) => {
    if (obj.length == 0) {
      return "";
    } else {
      return `${obj[obj.length - 1].value.toFixed(2)}`;
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      let now = new Date();
      let elapsed = {
        hours: String(now.getHours() - missionStart.getHours()).padStart(
          2,
          "0"
        ),
        minutes: String(now.getMinutes() - missionStart.getMinutes()).padStart(
          2,
          "0"
        ),
        seconds: String(now.getSeconds() - missionStart.getSeconds()).padStart(
          2,
          "0"
        ),
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

  const generateObj = (timeStamp: string, value: any) => {
    return { name: timeStamp, value: value };
  };

  const getTimeStamp = () => {
    let now = new Date();
    return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
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
      prevVelocity.concat(generateObj(timeStamp, data["velocity"])).slice(-15)
    );
    setAltitude((prevAltitude) =>
      prevAltitude.concat(generateObj(timeStamp, data["altitude"])).slice(-15)
    );
    setTemperature((prevTemperature) =>
      prevTemperature
        .concat(generateObj(timeStamp, data["temperature"]))
        .slice(-15)
    );
    setIsAscending(data["isascending"]);
    setStatusText(data["statusmessage"]);

    if (data["isactionrequired"] && updateButtonDisabled) {
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
    console.log(socket.current);
    console.log(`updateButton: ${updateButtonDisabled}`);
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
      }, 2000);
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
          <div className="graphAltitude">
            <GraphSquare
              data={altitude}
              label="Altitude"
              value={getLastValue(altitude)}
              unit="m"
            />
          </div>
          <div className="graphTemperature">
            <GraphSquare
              data={temperature}
              label="Temperature"
              value={getLastValue(temperature)}
              unit="C"
            />
          </div>
        </div>
        <div className="graphContainer">
          <div className="graphVelocity">
            <GraphSquare
              data={velocity}
              label="Velocity"
              value={getLastValue(velocity)}
              unit="m/s"
            />
          </div>

          <div className="buttonContainer">
            <div>
              <div>{statusText}</div>
              <div>The spacecraft is {ascendingText[Number(isAscending)]}</div>
              <img
                className="spaceImg"
                src={spacecraft}
                height="150"
                style={{
                  transform: `rotate(${
                    rotationValues[Number(isAscending)]
                  }deg)`,
                }}
              />
            </div>
            <div>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
