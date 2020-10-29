import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Bar } from "react-chartjs-2";

//neccessary for graph styling due to CSP
Chart.platform.disableCSSInjection = true;

const mapStateToProps = (store) => ({
  dataPoints: store.business.dataPoints,
});

const BarGraph = ({ dataPoints }) => {
  //state for showing graph, depending on whether there are datapoints or not.
  //must default to true, because graph will not render if initial container's display is 'none'
  const [show, toggleShow] = useState(true);
  //Default state for chart data
  const [chartData, updateChart] = useState({
    labels: [],
    datasets: [
      {
        data: [],
      },
    ],
  });
  //default state for chart options
  const [chartOptions, updateOptions] = useState({
    scales: {
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Response time",
          },
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      xAxes: [
        {
          ticks: {
            display: true,
          },
        },
      ],
    },
    animation: {
      duration: 500, //buggy animation, get rid of transition
    },
    maintainAspectRatio: false,
  });

  //helper function that returns chart data object
  const dataUpdater = (labelArr, dataArr, BGsArr, bordersArr) => {
    return {
      labels: labelArr,
      datasets: [
        {
          label: "Response Time",
          data: dataArr,
          backgroundColor: BGsArr,
          borderColor: bordersArr,
          borderWidth: 1,
          maxBarThickness: 300,
        },
      ],
    };
  };

  //helper function that returns chart options object
  const optionsUpdater = (arr) => {
    //Event labels and Y-axis title disappear after three requests
    const showLabels = arr.length > 5 ? false : true;
    return {
      legend: {
        display: false,
      },
      scales: {
        yAxes: [
          {
            scaleLabel: {
              display: showLabels, //boolean
            },
            ticks: {
              beginAtZero: true,
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              display: showLabels, //boolean
            },
          },
        ],
      },
      animation: {
        duration: 0,
      },
      maintainAspectRatio: false, //necessary for keeping chart within container
    };
  };

  useEffect(() => {
    let urls, times, BGs, borders;
    if (dataPoints.length) {
      //extract arrays from data point properties to be used in chart data/options that take separate arrays
      urls = dataPoints.map(({ url }) => {
        // regex to get just the main domain 
        if (url.charAt(0).toLowerCase() === "h") {
          const domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
          // if url is lengthy, just return the domain and the end of the uri string
          return `${domain} ${(url.length > domain.length + 8) ? `- ..${url.slice(url.length - 8, url.length)}` : ""}`
        } 
        // if grpc, just return the server IP
        return url
        });
      times = dataPoints.map((point) => point.timeReceived - point.timeSent);
      BGs = dataPoints.map((point) => "rgba(" + point.color + ", 0.2)");
      borders = dataPoints.map((point) => "rgba(" + point.color + ", 1)");
      //show graph upon receiving data points
      toggleShow(true);
    } else {
      //hide graph when no data points
      toggleShow(false);
    }
    //update state with updated dataset
    updateChart(dataUpdater(urls, times, BGs, borders));
    //conditionally update options based on length of dataPoints array
    if (!dataPoints.length || dataPoints.length > 3)
      updateOptions(optionsUpdater(dataPoints));
  }, [dataPoints]);

  const chartClass = show ? "chart" : "chart-closed";

  return (
    <div id="chartContainer" className={chartClass}>
      <Bar data={chartData} width={50} height={200} options={chartOptions} />
    </div>
  );
};

export default connect(mapStateToProps)(BarGraph);
