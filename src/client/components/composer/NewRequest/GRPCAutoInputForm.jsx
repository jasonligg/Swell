import React, { useState, useEffect } from "react";
import dropDownArrow from "../../../../assets/icons/arrow_drop_down_black_192x192.png";
import GRPCBodyEntryForm from "./GRPCBodyEntryForm.jsx";

const GRPCAutoInputForm = (props) => {
  //component state for toggling show/hide
  const [show, toggleShow] = useState(true);
  //component state for service and request dropdown
  const [serviceNameOption, selectServiceOption] = useState("Select Service");
  const [requestNameOption, selectRequestOption] = useState("Select Request");

  const {
    selectedService,
    selectedRequest,
    services,
    streamsArr,
    streamContent,
    selectedPackage,
    selectedStreamingType,
    selectedServiceObj,
  } = props.newRequestStreams;

  // event handler for changes made to the Select Services dropdown list
  const setService = (e) => {
    selectServiceOption(e.target.value);
    const serviceName =
      e.target.value !== "Select Service" ? e.target.value : null;
    const serviceObj = services.find((ser) => ser.name === e.target.value);
    // clears all stream query bodies except the first one
    props.clearStreamBodies();
    // the selected service name is saved in state of the store, mostly everything else is reset
    props.setNewRequestStreams({
      ...props.newRequestStreams,
      selectedService: serviceName,
      selectedServiceObj: serviceObj,
    });
  };

  // event handler for changes made to the Select Requests dropdown list
  const setRequest = (e) => {
    selectRequestOption(e.target.value);
    const requestName =
      e.target.value !== "Select Request" ? e.target.value : null;
    props.clearStreamBodies();

    // clears all stream bodies except the first when switching from client/directional stream to something else
    const newStreamsArr = [streamsArr[0]];
    const newStreamContent = [streamContent[0]];

    // the selected request name is saved in state of the store
    props.setNewRequestStreams({
      ...props.newRequestStreams,
      selectedPackage: null,
      selectedRequest: requestName,
      selectedStreamingType: null,
      streamContent: newStreamContent,
      streamsArr: newStreamsArr,
    });
  };

  useEffect(() => {
    if (!selectedRequest || !selectedServiceObj) {
      return;
    }
    // save the selected service/request and array of all the service objs in variables,
    // which is currently found in the state of the store
    const results = {};
    //   for each service obj in the services array, if its name matches the current selected service option then:
    //   - save the package name
    //   - iterate through the rpcs and if its name matches the current selected request then save its streaming type

    //  for each service obj in the services array, if its name matches the current selected service option then:
    //  - iterate through the rpcs and if its name matches the current selected request then save the name of req/rpc
    //  - iterate through the messages and if its name matches the saved req/rpc name,
    //  then push each key/value pair of the message definition into the results array

    // const serviceObj = services.find((ser) => ser.name === selectedService);
    const rpc = selectedServiceObj.rpcs.find(
      (rpc) => rpc.name === selectedRequest
    );

    const message = selectedServiceObj.messages.find(
      (msg) => msg.name === rpc.req
    );

    for (const key in message.def) {
      // if message type is a nested message (message.def.nested === true)
      if (message.def[key].nested) {
        for (const submess of selectedServiceObj.messages) {
          if (submess.name === message.def[key].dependent) {
            // define obj for the submessage definition
            const subObj = {};
            for (const subKey in submess.def) {
              subObj[subKey] = submess.def[subKey].type.slice(5).toLowerCase();
            }
            results[key] = subObj;
            break;
          }
        }
      } else {
        results[key] = message.def[key].type.slice(5).toLowerCase();
      }
    }

    // push JSON formatted query in streamContent arr
    const queryJSON = JSON.stringify(results, null, 4);
    if (streamsArr[0] !== "") {
      streamsArr[0].query = queryJSON;
    }
    // remove initial empty string then push new query to stream content arr
    streamContent.pop();
    streamContent.push(queryJSON);

    props.setNewRequestStreams({
      ...props.newRequestStreams,
      selectedPackage: selectedServiceObj.packageName,
      selectedStreamingType: rpc.type,
      streamsArr,
      streamContent,
      initialQuery: queryJSON,
    });
  }, [selectedRequest]);

  // arrow button used to collapse or open the Stream section
  const arrowClass = show
    ? "composer_subtitle_arrow-open"
    : "composer_subtitle_arrow-closed";
  const bodyContainerClass = show
    ? "composer_bodyform_container-open"
    : "composer_bodyform_container-closed";

  //default options shown for services and request dropdowns
  const servicesList = [
    <option key="default" value="Select Service">
      Select Service
    </option>,
  ];
  const rpcsList = [
    <option key="default" value="Select Request">
      Select Request
    </option>,
  ];

  // autopopulates the service dropdown list
  if (services) {
    services.forEach((ser, i) => {
      servicesList.push(
        <option key={i} value={ser.name}>
          {ser.name}
        </option>
      );
    });
  }
  // autopopulates the request dropdown list
  if (selectedServiceObj) {
    for (let i = 0; i < selectedServiceObj.rpcs.length; i++) {
      rpcsList.push(
        <option key={i} value={selectedServiceObj.rpcs[i].name}>
          {selectedServiceObj.rpcs[i].name}
        </option>
      );
    }
  }

  return (
    <div>
      <div
        className="composer_subtitle"
        onClick={() => toggleShow(!show)}
        style={props.stylesObj}
      >
        <img className={arrowClass} src={dropDownArrow} />
        Stream
      </div>

      <select
        id="dropdownService"
        value={serviceNameOption}
        onChange={setService}
        name="dropdownService"
        className={"dropdownService " + bodyContainerClass}
      >
        {servicesList}
      </select>

      <select
        id="dropdownRequest"
        value={requestNameOption}
        onChange={setRequest}
        name="dropdownRequest"
        className={"dropdownRequest " + bodyContainerClass}
      >
        {rpcsList}
      </select>

      <GRPCBodyEntryForm
        newRequestStreams={props.newRequestStreams}
        setNewRequestStreams={props.setNewRequestStreams}
        selectedPackage={selectedPackage}
        selectedService={selectedService}
        selectedRequest={selectedRequest}
        selectedStreamingType={selectedStreamingType}
      />
    </div>
  );
};

export default GRPCAutoInputForm;
