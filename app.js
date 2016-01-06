function readCsvData() {
    var fileToRead = getQueryParam("file");
    if (!fileToRead) {
        var error = "Missing required file: Add query parameter 'file' to specify the file to read (e.g. ?file=data/01-05-2016.sleepdata).";
        return Promise.reject(error);
    }
    return fetch(fileToRead)
        .then(response => {
            if (!response.ok) {
                return Promise.reject(`fetch(${response.url}) returned ${response.status} ${response.statusText}.`)
            } else {
                return response.text();
            }
        });
}

function getQueryParam(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var times = [], xs = [], ys = [], zs = [];
var maxData = 0;
$(function () {
    readCsvData()
        .then((data) => {
            var dataLines = data.split('\n');
            var index = 0;
            for (dataLine of dataLines) {
                index++;
                if (dataLine === '') {
                    continue;
                }
                var dataLineSplit = dataLine.split(',');
                var time = parseInt(dataLineSplit[0]);
                var x = Math.abs(parseFloat(dataLineSplit[1]));
                var y = Math.abs(parseFloat(dataLineSplit[2]));
                var z = Math.abs(parseFloat(dataLineSplit[3]));
                times.push(time);
                xs.push({x: time, y: x});
                ys.push({x: time, y: y});
                zs.push({x: time, y: z});
                if (x + y + z > maxData) {
                    maxData = x + y + z;
                }
                //console.log(time, x, y, z);
            }
        })
        .then(() => {
            graphChart();
        })
        .catch(e => {
            document.write(`<div style="color: red; font-weight: 600; font-size: 1.35em; font-family: monospace;">${e}</div>`);
            console.error(e);
        });
});

function graphChart() {
    var clip = undefined;
    var chartType = "area";
    var titleFontColor = 'rgb(51, 51, 51)';
    var titleFontFamily = 'Proxima Nova';
    var titleFontSize = 22;
    var titleFontWeight = 400;
    var labelFontColor = 'rgb(100, 100, 100)';
    var labelFontWeight = 100;
    var labelFontSize = 14;
    var gridColor = 'rgb(235, 235, 235)';
    var gridDashType = 'solid';
    var startDate = new Date(times[0]);
    var endDate = new Date(times[times.length - 1]);
    var timeDiff = Math.abs(endDate - startDate);
    var diffHours = timeDiff / (1000 * 60 * 60);
    diffHours = Math.round(diffHours * 100) / 100;
    var dataLineThickness = 1;
    var fillOpacity = 0.5;
    CanvasJS.addColorSet("mainPalette",
        [
            "#5DA5DA",
            "#FAA43A",
            "#60BD68",
        ]);
    var chart = new CanvasJS.Chart("chartContainer", {
        theme: "theme1",//theme1
        colorSet: 'mainPalette',
        zoomEnabled: true,
        animationEnabled: false,
        exportEnabled: true,
        title: {
            text: `Sleep Activity Data — ${moment(startDate).format("dddd, MMMM Do YYYY")} (${moment(startDate).format("h:mm A")} – ${moment(endDate).format("h:mm A")}, ${diffHours} hours)`,
            fontColor: titleFontColor,
            fontFamily: titleFontFamily,
            fontSize: 28,
            fontWeight: titleFontWeight,
            margin: 0,
            padding: 50,
        },
        legend: {
            fontSize: 18,
            fontFamily: titleFontFamily,
            fontWeight: 100,
        },
        axisX: {
            title: 'Time',
            titleFontColor: titleFontColor,
            titleFontFamily: titleFontFamily,
            titleFontSize: titleFontSize,
            titleFontWeight: titleFontWeight,
            labelFontFamily: titleFontFamily,
            labelFontColor: labelFontColor,
            labelFontWeight: labelFontWeight,
            labelFontSize: labelFontSize,
            margin: 10,
            tickLength: 10,
            tickThickness: 0,
            gridThickness: 1,
            gridColor: gridColor,
            gridDashType: gridDashType,
            lineThickness: 1,
            lineColor: gridColor,
            valueFormatString: 'h:mm TT'
        },
        axisY: {
            title: 'Acceleration',
            titleFontColor: titleFontColor,
            titleFontFamily: titleFontFamily,
            titleFontSize: titleFontSize,
            titleFontWeight: titleFontWeight,
            labelFontFamily: titleFontFamily,
            labelFontColor: labelFontColor,
            labelFontWeight: labelFontWeight,
            labelFontSize: labelFontSize,
            lineThickness: 1,
            lineColor: gridColor,
            tickLength: 5,
            tickThickness: 0,
            gridThickness: 1,
            margin: 30,
            gridColor: gridColor,
            gridDashType: gridDashType,
            //maximum: clip,
        },
        toolTip: {
            shared: true,
            animationEnabled: false,
            borderColor: 'rgb(240, 240, 240)',
            borderThickness: 1,
            cornerRadius: 2,
            fontFamily: titleFontFamily,
            fontWeight: 400,
            fontStyle: 'normal',
            backgroundColor: '#fff',
            contentFormatter: function (e) {
                var time = e.entries[0].dataPoint.x;
                var header = `<div style="margin: 5px; font-family: Proxima Nova; font-weight: 400;">`;
                var str = `<div style="margin-bottom: 0.5em; font-size: 18px;">${moment(time).format('h:mm A')}</div>`;
                str += `<div style="border-bottom: 1px solid rgb(230, 230, 230); margin: 0 -16px; margin-bottom: 0.75em;"></div>`;
                var total = 0;
                for (var i = 0; i < e.entries.length; i++) {
                    var color = e.entries[i].dataSeries._colorSet[i];
                    var name = e.entries[i].dataSeries.name;
                    var data = e.entries[i].dataPoint.y;
                    data = Math.round(data * 100) / 100;
                    total += data;
                    str += `<div style="margin-top: 0.5em; font-size: 16px;"><span style="font-weight: 600;">${name}:</span> <span style="font-weight: 400; font-size: 16px;">${data}</span></div>`
                }
                str += `<div style="margin-top: 0.5em; font-size: 16px;"><span style="font-weight: 600;">% of Max:</span> <span style="font-weight: 400; font-size: 16px;">${Math.round(((total / maxData * 100) * 100) / 100)}%</span></div>`
                var footer = `</div>`;
                return (header + str + footer);
            }
        },
        data: [
            {
                type: chartType,
                xValueType: "dateTime",
                dataPoints: xs,
                lineThickness: dataLineThickness,
                fillOpacity: fillOpacity,
                showInLegend: true,
                legendText: 'X Axis Acceleration',
                legendMarkerType: 'circle',
                name: 'X',
            },
            {
                type: chartType,
                dataPoints: ys,
                lineThickness: dataLineThickness,
                fillOpacity: fillOpacity,
                showInLegend: true,
                legendText: 'Y Axis Acceleration',
                legendMarkerType: 'circle',
                name: 'Y',
            },
            {
                type: chartType,
                dataPoints: zs,
                lineThickness: dataLineThickness,
                fillOpacity: fillOpacity,
                showInLegend: true,
                legendText: 'Z Axis Acceleration',
                legendMarkerType: 'circle',
                name: 'Z',
            },
        ]
    });
    chart.creditText = '';
    chart.creditHref = '';
    chart.render();
}

function graphChartOld() {
    Chart.defaults.global.animation = false;
    //Chart.defaults.global.showTooltips = false;
    Chart.defaults.global.showScale = false;
    var ctx = document.getElementById("myChart").getContext("2d");
    var options = {
        pointDot: false,
        datasetStroke: false,
        datasetFill: false
    };
    var data = {
        labels: times,
        datasets: [
            {
                label: "X",
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: xs
            },
            {
                label: "Y",
                fillColor: "rgba(151,187,205,0.2)",
                strokeColor: "rgba(151,187,205,1)",
                pointColor: "rgba(151,187,205,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(151,187,205,1)",
                data: ys
            },
            {
                label: "Z",
                fillColor: "rgba(121,157,175,0.2)",
                strokeColor: "rgba(121,157,175,1)",
                pointColor: "rgba(121,157,175,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(121,157,175,1)",
                data: zs
            }
        ]
    };
    var myLineChart = new Chart(ctx).Line(data, options);
}

function graphChartOlder() {
    $('#container').highcharts({
        plotOptions: {
            line: {
                turboThreshold: 0,
                lineWidth: 1.5,
            }
        },
        title: {
            text: 'Accelerometer Graph',
        },
        yAxis: {
            title: {
                text: 'Acceleration'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {},
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [{
            name: 'X',
            data: xs
        }, {
            name: 'Y',
            data: ys
        }, {
            name: 'Z',
            data: zs
        }]
    });
}