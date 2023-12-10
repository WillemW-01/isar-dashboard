import { useEffect, useState } from "react";
import "./App.css";
import GraphSquare from "./components/GraphSquare";

import spacecraft from "./assets/spacecraft.png";
import isarLogo from "./assets/logo.png";
const App = () => {
  interface DataPoint {
    name: string;
    value: any;
  }

  const [count, setCount] = useState(0);
  const [velocity, setVelocity] = useState<DataPoint[]>([]);
  const [altitude, setAltitude] = useState<DataPoint[]>([]);
  const [temperature, setTemperature] = useState<DataPoint[]>([]);
  const [isAscending, setIsAscending] = useState(false);
  const [shouldTakeAction, setShouldTakeAction] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("--:--:--");
  const [missionTime, setMissionTime] = useState("");

  const missionStart = new Date(2023, 11, 1);
  const apiUrl =
    "https://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumStatus";
  const ascendingText = ["not ascending", "ascending"];
  const rotationValues = [45, 0];
  const imgStyle = {
    transform: `rotate(${rotationValues[Number(isAscending)]}deg)`,
  };

  const getLastValue = (obj: DataPoint[]) => {
    if (obj.length == 0) {
      return "";
    } else {
      return `${obj[obj.length - 1].value.toFixed(2)}`;
    }
  };

  useEffect(() => {
    let now = new Date();
    let elapsed = {
      hours: String(now.getHours() - missionStart.getHours()).padStart(2, "0"),
      minutes: String(now.getMinutes() - missionStart.getMinutes()).padStart(
        2,
        "0"
      ),
      seconds: String(now.getSeconds() - missionStart.getSeconds()).padStart(
        2,
        "0"
      ),
    };
    const timer = setInterval(
      () =>
        setMissionTime(
          `${elapsed["hours"]}:${elapsed["minutes"]}:${elapsed["seconds"]}`
        ),
      1100
    );

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

  const fetchData = () => {
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
        let timeStamp = getTimeStamp();
        updateValues(timeStamp, data);
      })
      .catch((error) => console.log(error));
  };

  const updateValues = (timeStamp: string, data: any) => {
    setLastUpdate(timeStamp);
    setVelocity(velocity.concat(generateObj(timeStamp, data["velocity"])));
    setAltitude(altitude.concat(generateObj(timeStamp, data["altitude"])));
    setTemperature(
      temperature.concat(generateObj(timeStamp, data["temperature"]))
    );
    setIsAscending(data["isAscending"]);
  };

  const openSocket = () => {
    const exampleSocket = new WebSocket(
      "wss://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumWS"
    );
    exampleSocket.onmessage = (event) => {
      let timeStamp = getTimeStamp();
      console.log(event.data);
      updateValues(timeStamp, event.data);
    };
  };

  return (
    <>
      <div className="titleContainer">
        <div className="logoContainer">
          <img src={isarLogo} height="75px" />
          <div>
            <b>SPECTRUM MAIDEN LAUNCH</b>
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
        <div className="container1">
          <div className="graphVelocity">
            <GraphSquare
              data={velocity}
              label="Velocity"
              value={getLastValue(velocity)}
              unit="m/s"
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
        <div className="container2">
          <GraphSquare
            className="graphAltitude"
            data={altitude}
            label="Altitude"
            value={getLastValue(altitude)}
            unit="m"
          />
          <div>
            <div>
              <div>The spacecraft is {ascendingText[Number(isAscending)]}</div>
              <img
                id="spaceImg"
                src={spacecraft}
                height="150"
                style={imgStyle}
              />
            </div>
            <div>
              <button onMouseDown={fetchData}>Update</button>
              <button onMouseDown={openSocket}>Stream</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
