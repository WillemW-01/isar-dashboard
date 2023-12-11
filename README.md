# Spectrum Maiden Flight Dashboard

This is the submission to the technical assessment from Isar Aerospace Web Frontend Software Engineer.

## Description

_Spectrum_, the launch vehicle built by Isar Aerospace just performed a successful lift-off from
the launch pad and is flying towards Earth orbit. This project visualizes the
sensor system from _Spectrum_ using a web service such that the ground control crew
can ensure the flight operates smoothly.

## Environment

- Vite
- React

Install the necessary libraries:

`$ cd app; npm install`

## Execution

The app was only tested in dev mode and can be run using the following command (in the `app` directory):

`$ npm run dev`

See the sections below for more information about the UI.

## Assignment A Details

It made most sense to make the dashboard include simple line graphs. Since I had no prior knowledge on the expected maximum or minimum values for the different sensors, I chose not to use gauges or other data representation methods.

The the `altitude` and `velocity` line graphs display the last 30 values, but have the y-axis set to the global maximum and minimum. The `temperature` graph only show the last 20 values.

The box at the bottom-right shows the current values all at once place, as well as the max and min seen so far. There is a button to update the information, and this will reflect at the top-right where the last-update time is displayed.

The `Steam` button can be ignored for now.

The `Download` button can be used to download all the data that was received to this point in csv format. _Note that due to the internals of the program, the values are only written to 2 decimals._

The **MISSION CLOCK** shows the time since the craft was launched, and for now it is set to the previous day as an example.

The layout is semi-flexible, but is not responsive per-se (element won't move out into new positions once the viewport has been changed significantly).

I assumed that when the boolean for `isAscending` is `false`, it does not necessarily mean that the spacecraft is descending, as a constant altitude is possible.

## Assignment B Details

Now the `Stream` button is important. This will open a WebSocket to the specified `wss` url and retrieve the data as soon as it is ready. The button will be changed to a `Stop` button once pressed, to enable toggling of the socket receiving data. Starting, stopping, and then using the normal update function works perfectly.

The `isActionRequired` value is now considered, and this will open a modal that will require the user to take action. A random choice of a custom set of text prompts will be used to display what is "wrong".

At the moment, a limitation is that only a single action can be taken at a time, and when other actions arise once a certain one is not dealt with, they will be missed. For example, `isActionRequired` becomes true, and in the next payload, it is true again. The user will only be able to address the first action. That means, there is no queue for actions. Given more time, this would have been addressed.

Another limitation is that the HTTP connection is not properly upgraded to a WebSocket using HTTP headers manually, as suggested by the assignment. I did not have success with it due to the fetch api not supporting `wss` URIs, therefore I rather just sticked to a solution that worked.

I also thought of highlighting certain parts of the UI a certain colour to indicate the user must take action, instead of just using a modal. Given more time, I would've tried a few different things to see what would've worked the best.

## Assignment C Details

- The API response object keys has inconsistent capitalisation, which made it hard to make the code compact. For example, with the first API, the keys were `isActionRequired` and `velocity`, whereas in the second API, they were `IsActionRequired` and `Velocity`. This added unnecessary code to deal with this, and also subverted my expectations when moving on to Assignment B.

- Sometimes the WebSocket would only start sending messages after an appreciable delay (~6 sec).

- Being able to set the desired update interval when requesting data from the server would be helpful, if certain granularities are necessary. For example, in the first few phases of the launch, a higher refresh rate might be necessary and quicker action must be able to be taken.

- 500ms as a refresh rate seems also quite slow, and it might be worth optimising the server for quicker refreshing.

- `isActionRequired` is a bit simple of a response. I believe it would be more appropriate to have `actionRequired: <action>` if it could be determined, and have `<action>` be some vauge, default value if it could not be determined automatically.

- `isAscending` does not have to be a boolean, as a third state is also possible: constant altitude. Therefore, I would've made this an integer with three states and use enums to process them. Alternatively, strings would also work if it is not critical that space be saved when transmitting the information.

- for the ActOnSpectrum endpoint, one would expect that some data must be sent via a POST method. However, it was not specified in the API description whether this was necessary (also the POST method was rejected by the server). It would make more sense to either start the endpoint with a noun to indicate a GET method or to make it clearer that it is necessary for data to be sent to this endpoint.

## Final notes

I was on a hiking trip and could only start on this on Saturday 9/12 (having until Tuesday 12/12). Therefore, and as mentioned above, I would've wanted to add more things if I had a bit more time.

I hope you enjoyed the solution here, and I look forward to hear back from you.
