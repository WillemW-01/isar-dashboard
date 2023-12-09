import { useState } from "react";
import spacecraft from "./assets/spacecraft.png";
import "./App.css";
import GraphSquare from "./components/GraphSquare";

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
  const apiUrl =
    "https://webfrontendassignment-isaraerospace.azurewebsites.net/api/SpectrumStatus";

  const ascendingText = ["not ascending", "ascending"];
  const [rotationValues, setRotationValues] = useState([45, 0]);

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

  const generateObj = (timeStamp: string, value: any) => {
    return { name: timeStamp, value: value };
  };

  const updateValues = () => {
    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        let now = new Date();
        let timeStamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        setVelocity(velocity.concat(generateObj(timeStamp, data["velocity"])));
        setAltitude(altitude.concat(generateObj(timeStamp, data["altitude"])));
        setTemperature(
          temperature.concat(generateObj(timeStamp, data["temperature"]))
        );
        setIsAscending(data["isAscending"]);
      })
      .catch((error) => console.log(error));
  };

  return (
    <>
      <GraphSquare
        data={velocity}
        label="Velocity"
        value={getLastValue(velocity)}
        unit="m/s"
      />
      <GraphSquare
        data={temperature}
        label="Temperature"
        value={getLastValue(temperature)}
        unit="C"
      />
      <GraphSquare
        data={altitude}
        label="Altitude"
        value={getLastValue(altitude)}
        unit="m"
      />
      <div>
        <div>
          <div>The spacecraft is {ascendingText[Number(isAscending)]}</div>
          <img id="spaceImg" src={spacecraft} height="150" style={imgStyle} />
        </div>
        <div>
          <button onMouseDown={updateValues}>Update</button>
        </div>
      </div>
    </>
  );
};

export default App;
