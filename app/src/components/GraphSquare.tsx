import React from "react";
import { LineChart, Line } from "recharts";

const GraphSquare = (props: any) => {
  return (
    <>
      <div>
        <LineChart width={400} height={200} data={props.data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            animationDuration={200}
          />
        </LineChart>
      </div>
      <div>
        {props.label}: {props.value} {props.unit}
      </div>
    </>
  );
};

export default GraphSquare;
