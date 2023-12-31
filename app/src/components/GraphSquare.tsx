// import React from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import "./graphSquare.css";

const GraphSquare = (props: any) => {
  return (
    <div className="graphSquare">
      <ResponsiveContainer width="100%" minHeight="30vh" maxHeight={200}>
        <LineChart data={props.data}>
          <XAxis dataKey="name" angle={-60} />
          <YAxis
            type="number"
            domain={[props.min, props.max]}
            allowDataOverflow={true}
            padding={{ top: 10, bottom: 10 }}
            allowDecimals={false}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#095EDD"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="graphLabel">
        {props.label}: {props.value} {props.unit}
      </div>
    </div>
  );
};

export default GraphSquare;
