// import React from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import zoomPlugin from "chartjs-plugin-zoom";
import "./graphSquare.css";

const GraphSquare = (props: any) => {
  return (
    <div className="graphSquare">
      <ResponsiveContainer width="100%" minHeight="30vh" maxHeight={200}>
        <LineChart data={props.data}>
          <XAxis dataKey="name" angle={-45} />
          <YAxis />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#095EDD"
            animationDuration={150}
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
