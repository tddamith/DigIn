/**
 * Created by Damith on 2/12/2016.
 */

routerApp.controller('queryBuilderCtrl', function ($scope, $rootScope, $location, $window, $csContainer, $diginengine, $state, $stateParams, ngToast) {

    $scope.goDashboard = function () {
        $state.go('home.Dashboards');
    }

    $scope.initQueryBuilder = function () {
        if (typeof($scope.widget.commonSrc) == "undefined") {
            $scope.selectedChart = $scope.commonData.chartTypes[0];
            $scope.highCharts.onInit(false);
        } else {
            $scope.selectedChart = $scope.widget.selectedChart;
            eval("$scope." + $scope.selectedChart.chartType + ".onInit(true)");
            $scope.executeQryData.executeMeasures = $scope.widget.commonSrc.mea;
            $scope.executeQryData.executeColumns = $scope.widget.commonSrc.att;
            $scope.receivedQuery = $scope.widget.commonSrc.query;
        }
    };

    $scope.widget = $stateParams.widObj;
    $scope.isDrilled = false;
    $scope.dynFlex = 70;
    $scope.chartWrapStyle = {height: 'calc(55vh)'};
    $scope.isPendingRequest = false;
    $scope.sourceData = $csContainer.fetchSrcObj();
    $scope.client = $diginengine.getClient($scope.sourceData.src);
    $scope.queryEditState = false;
    $scope.metricObj = {
        scales: [{name: 'None', val: ""},
            {name: '$', val: "$"},
            {name: 'cm', val: "cm"},
            {name: 'm', val: "m"},
            {name: 'kg', val: "kg"}],
        decimals: [0, 1, 2, 3, 4]
    };
    $scope.forecastObj = {
        models: ["Additive", "Multiplicative", "Linear"],
        intervals: ["Daily", "Weekly", "Monthly", "Yearly"],
        errorLevels: [0.001, 0.01, 0.025, 0.05, 0.1, 0.2, 0.25],
        paramObj: {
            model: "Additive",
            pred_error_level: 0.001,
            alpha: 0,
            beta: 53,
            gamma: 34,
            fcast_days: 30,
            tbl: $scope.sourceData.tbl,
            field_name_d: "",
            field_name_f: "",
            steps_pday: 1,
            m: 7,
            interval: "Daily"
        }
    };
    $scope.recordedColors = {};

    $scope.initRequestLimit = {value: 1000};
    $scope.requestLimits = [1000, 2000, 3000, 4000, 5000];
    $scope.chartType = 'bar';

    $scope.initHighchartObj = {
        options: {
            chart: {
                type: $scope.chartType,
                // Explicitly tell the width and height of a chart
                width: null,
                height: 367
            }
        },
        title: {
            text: $scope.widget.widName,
//            x: -20 //center
        },

        xAxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        yAxis: {
            title: {
                text: 'Temperature (°C)'
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#EC784B'
            }]
        },
        tooltip: {
            valueSuffix: '°C'
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        colors: ['#EC784B'],
        series: [{
            name: 'Tokyo',
            color: '#EC784B',
            data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
        }, {
            name: 'series II',
            color: '#01718D',
            data: [13.19, 17.23, 25.74, 28.5, 33.9, 35.62, 37.0, 36.6, 34.82]
        }, {
            name: 'series I',
            color: '#DED7C6',
            data: [17.4, 16.1, 19.45, 24.15, 28.44, 33.15, 37.2, 41.25, 43.3]
        },]
    };


    //#private function
    var privateFun = (function () {

        return {
            checkToggleOpen: function (openWindow) {
                switch (openWindow) {
                    case '1':
                        if ($scope.eventHndler.isToggleMeasure) {
                            $("#togglePanel").hide(200);
                            $scope.eventHndler.isToggleMeasure = false;
                        }
                        break;
                    case '2':
                        if ($scope.eventHndler.isToggleColumns) {
                            $("#togglePanelColumns").hide(200);
                            $scope.eventHndler.isToggleColumns = false;
                        }
                        break;
                }
            },
            createHighchartsChart: function (type) {
                //high charts config
                $scope.chartType = type;
                $scope.highchartsNG = $scope.initHighchartObj;
            },
            fireMessage: function (msgType, msg) {

                var _className;
                if (msgType == '0') {
                    _className = 'danger';
                } else if (msgType == '1') {
                    _className = 'success';
                }
                ngToast.create({
                    className: _className,
                    content: msg,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    dismissOnClick: true
                });
            },
            grySyntaxErrorMsg: function (type, value) {
                //key
                //0 : invalid query
                //01 : from is missing
                switch (type) {
                    case "0":
                        privateFun.fireMessage('0', '<strong>SQL syntax error : </strong>please check your query.');
                        break;
                    case "01":
                        privateFun.fireMessage('0', '<strong>SQL syntax error : </strong>In this example, the keyword "FROM" is misspelled.');
                        break;
                    case "02":
                        privateFun.fireMessage('0', '<strong>SQL syntax error : </strong>In this example, the keyword "TABLE" is misspelled.');
                        break;
                    case "03":
                        privateFun.fireMessage('0', '<strong>SQL syntax error : </strong>In this example, the keyword "SELECT" is misspelled.');
                        break;
                    case "04":
                        privateFun.fireMessage('0', '<strong>SQL syntax error : </strong>In this example, the table filed  is misspelled.');
                        break;
                    case "isNumber":
                        var reg = /^\d+$/;
                        return reg.test(value);
                        break;
                }

            },
            isQrySyntaxError: function (qry) {
                if (typeof qry != 'undefined') {
                    var splitQry = qry.split(" ");
                    if (splitQry.length < 4) {
                        privateFun.grySyntaxErrorMsg("04", null);
                        return false;
                    } else {
                        if (!privateFun.grySyntaxErrorMsg("isNumber", splitQry[0])) {
                            var i = 0;
                            var stateQry = {
                                hasFrom: false,
                                fromIndex: 0,
                                hasTbl: false,
                                tblIndex: 0
                            };
                            for (i; splitQry.length > i; i++) {
                                if (splitQry[i].toLowerCase().trim() == 'from') {
                                    stateQry.hasFrom = true;
                                    stateQry.tblIndex = i + 1;
                                    stateQry.fromIndex = i;
                                    i = splitQry.length;
                                } else {
                                    stateQry.hasFrom = false;
                                }
                            }

                            //is check select
                            if (splitQry[0].toLowerCase().trim() != "select") {
                                privateFun.grySyntaxErrorMsg("03", null);
                                return false;
                            }
                            //check table filed
                            var filedAry = splitQry.slice(1, stateQry.fromIndex);
                            if (filedAry.length == 0) {
                                privateFun.grySyntaxErrorMsg("04", null);
                                return false;
                            }
                            //is check syntax from
                            if (!stateQry.hasFrom) {
                                privateFun.grySyntaxErrorMsg("01", null);
                                return false;
                            }
                        }
                        else {
                            privateFun.grySyntaxErrorMsg("0", null);
                            return false;
                        }
                    }
                }
                else {
                    privateFun.fireMessage('0', '<strong>Invalid query : </strong>please enter your query');
                    return false;
                }
            }
        }

    })();

    //Get query string value
    var urlString = this;
    urlString = $location.search();
    $scope.queryStr = {
        crntQryBuildNme: urlString.qry
    };

    $scope.commonData = {
        measures: [
            //                {id: 'm01', filedName: 'Unit price', click: false},
            //                {id: 'm02', filedName: 'Price', click: false}
        ],
        columns: [
            //                {id: 'a01', filedName: 'name', click: false},
            //                {id: 'a02', filedName: 'location', click: false}
        ],
        measureCondition: [{
            id: 'c01',
            name: 'AVG',
            click: false,
            dragging: false,
            proBy: 'mc0'
        }, {
            id: 'c02',
            name: 'SUM',
            click: false,
            dragging: false,
            proBy: 'mc0'
        }, {
            id: 'c03',
            name: 'COUNT',
            click: false,
            dragging: false,
            proBy: 'mc0'
        }, {
            id: 'c04',
            name: 'MIN',
            click: false,
            dragging: false,
            proBy: 'mc0'
        }, {
            id: 'c05',
            name: 'MAX',
            click: false,
            dragging: false,
            proBy: 'mc0'
        }],
        chartTypes: [{
            id: 'ct01',
            icon: 'ti-pie-chart',
            name: 'pie chart',
            chart: 'pie',
            selected: false,
            chartType: 'highCharts',
            view: 'views/query/chart-views/highcharts.html',
            initObj: $scope.initHighchartObj,
            settingsView: 'views/query/settings-views/highchartsSettings.html'
        }, {
            id: 'ct02',
            icon: 'ti-bar-chart',
            name: 'bar ',
            chart: 'bar',
            selected: false,
            chartType: 'highCharts',
            view: 'views/query/chart-views/highcharts.html',
            initObj: $scope.initHighchartObj,
            settingsView: 'views/query/settings-views/highchartsSettings.html'
        }, {
            id: 'ct03',
            icon: 'fa fa-line-chart',
            icon: 'ti-bar-chart',
            name: 'column',
            chart: 'column',
            selected: false,
            chartType: 'highCharts',
            view: 'views/query/chart-views/highcharts.html',
            initObj: $scope.initHighchartObj,
            settingsView: 'views/query/settings-views/highchartsSettings.html'
        },
            {
                id: 'ct03',
                icon: 'ti-gallery',
                name: 'line ',
                chart: 'line',
                selected: false,
                chartType: 'highCharts',
                view: 'views/query/chart-views/highcharts.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct05',
                icon: ' chart-diginSmooth_line',
                name: 'Smooth line ',
                chart: 'spline',
                selected: false,
                chartType: 'highCharts',
                view: 'views/query/chart-views/highcharts.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct06',
                icon: 'fa fa-area-chart',
                name: 'area ',
                chart: 'area',
                selected: false,
                chartType: 'highCharts',
                view: 'views/query/chart-views/highcharts.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct07',
                icon: 'chart-diginsmooth_area',
                name: 'Smooth area ',
                chart: 'areaspline',
                selected: false,
                chartType: 'highCharts',
                view: 'views/query/chart-views/highcharts.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct08',
                icon: 'chart-diginscatter',
                name: 'scatter ',
                chart: 'scatter',
                selected: false,
                chartType: 'highCharts',
                view: 'views/query/chart-views/highcharts.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct9',
                icon: 'chart-diginhierarchy-chart',
                name: 'hierarchy',
                chart: 'hierarchy',
                selected: false,
                chartType: 'd3hierarchy',
                view: 'views/query/chart-views/hierarchySummary.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct10',
                icon: 'chart-diginsunburst-chart',
                name: 'sunburst',
                chart: 'sunburst',
                selected: false,
                chartType: 'd3sunburst',
                view: 'views/query/chart-views/sunburst.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct11',
                icon: 'chart-digintreeeview',
                name: 'treeeview',
                chart: 'treeeview',
                selected: false,
                chartType: 'd3Charts',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct12',
                icon: 'ti-layout-accordion-list',
                name: 'pivotsummary',
                chart: 'pivotsummary',
                selected: false,
                chartType: 'pivotSummary',
                view: 'views/query/chart-views/pivotSummary.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'

            }, {
                id: 'ct13',
                icon: 'fa fa-sort-numeric-desc',
                name: 'metric',
                chart: 'metric',
                selected: false,
                chartType: 'metric',
                view: 'views/query/chart-views/metric.html',
                initObj: {
                    value: 33852,
                    decValue: 33852,
                    scale: "",
                    dec: 2,
                    label: "Sales Average"
                },
                settingsView: 'views/query/settings-views/metricSettings.html'
            }, {
                id: 'ct14',
                icon: 'ti-map-alt',
                name: 'map',
                chart: 'map',
                selected: false,
                chartType: 'googleMap',
                view: 'views/googleMaps/ViewGoogleMapsBranches.html',
                initObj: {},
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct15',
                icon: 'fa fa-tasks',
                name: 'boxplot',
                chart: 'boxplot',
                selected: false,
                chartType: 'boxplot',
                view: 'views/query/chart-views/BoxPlot.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/highchartsSettings.html'

            }, {
                id: 'ct16',
                icon: 'fa fa-bar-chart',
                name: 'histogram',
                chart: 'histogram',
                selected: false,
                chartType: 'histogram',
                view: 'views/query/chart-views/histogram.html',
                initObj: {},
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct17',
                icon: 'ti-panel',
                name: 'bubble',
                chart: 'bubble',
                selected: false,
                chartType: 'bubble',
                view: 'views/query/chart-views/bubble.html',
                initObj: {},
                settingsView: 'views/query/settings-views/highchartsSettings.html'
            }, {
                id: 'ct18',
                icon: 'fa fa-line-chart',
                name: 'forecast',
                chart: 'forecast',
                selected: false,
                chartType: 'forecast',
                view: 'views/query/chart-views/highcharts.html',
                initObj: $scope.initHighchartObj,
                settingsView: 'views/query/settings-views/forecastSettings.html'
            }


        ]

    };


    //mapping measures array
    if ($scope.sourceData.fMeaArr.length > 0) {
        for (i = 0; i < $scope.sourceData.fMeaArr.length; i++) {
            $scope.commonData.measures.push({
                id: $scope.sourceData.fMeaArr[i].id,
                filedName: $scope.sourceData.fMeaArr[i].name,
                click: false,
                selectQry: [],
                proBy: 'm0'
            });
        }
    }


    //mapping attributes array
    if ($scope.sourceData.fAttArr.length > 0) {
        for (i = 0; i < $scope.sourceData.fAttArr.length; i++) {
            $scope.commonData.columns.push({
                id: $scope.sourceData.fAttArr[i].id,
                filedName: $scope.sourceData.fAttArr[i].name,
                click: false,
                selectQry: [],
                proBy: 'c0'
            });
        }
        $scope.commonData.columns = $scope.commonData.columns.concat($scope.commonData.measures);
    }

    console.log('source data:' + JSON.stringify());

    var executeQryData = {
        executeMeasures: [],
        executeColumns: [],
        chartType: '',
        electQry: [],
        GrpFiled: []
    };

    $scope.executeQryData = executeQryData;

    $scope.uiSource = {};

    $scope.eventHndler = {
        isToggleMeasure: false,
        isToggleColumns: false,
        isToggleMeasureDown: false,
        isLoadingChart: false,
        toggleDownName: [],
        isMainLoading: false,
        openSettingToggle: [{
            isChart: false
        }, {
            isStructuret: false
        }, {
            isSerSetting: false
        }],
        messageAry: ['Please wait while the data is saving...'],
        message: '',
        isChartSelected: false,
        onToggleEvent: function (event) {
            switch (event) {
                case '1':
                    //event measures
                    privateFun.checkToggleOpen('2');
                    if (this.isToggleMeasure) {
                        $("#togglePanel").hide(200);
                        this.isToggleMeasure = false;
                    } else {
                        if (this.openSettingToggle[1].isQueryBuilder) {
                            this.hideDesignQuery();
                        }
                        $("#togglePanel").show(300);
                        this.isToggleMeasure = true;
                    }

                    break;
                case '2':
                    //event columns
                    privateFun.checkToggleOpen('1');
                    if (this.isToggleColumns) {
                        $("#togglePanelColumns").hide(200);
                        this.isToggleColumns = false;
                    } else {
                        if (this.openSettingToggle[1].isQueryBuilder) {
                            this.hideDesignQuery();
                        }
                        $("#togglePanelColumns").show(300);
                        this.isToggleColumns = true;
                    }
                    break;
                case '3':
                    //event columns
                    privateFun.checkToggleOpen('1');
                    if (this.isToggleColumns) {
                        $("#togglePanelColumns").hide(200);
                        this.isToggleColumns = false;
                    } else {
                        if (this.openSettingToggle[1].isQueryBuilder) {
                            this.hideDesignQuery();
                        }
                        $("#togglePanelColumns").show(300);
                        this.isToggleColumns = true;
                    }
                    break;
                default:
                    break;
            }
        },
        onClickMeasureToggle: function (row) {
            if (row.click) {
                row.click = false;
            } else {
                row.click = true;
            }
        },
        onClickCondition: function (row, filed) {
            $("#togglePanel").hide(200);
            $scope.isPendingRequest = true;
            $scope.eventHndler.isToggleMeasure = false;

            var isFoundCnd = false;
            for (i in executeQryData.executeMeasures) {
                if (executeQryData.executeMeasures[i].filedName == filed.filedName &&
                    executeQryData.executeMeasures[i].condition == row.name) {
                    isFoundCnd = true;
                    //alert('duplicate record found in object...');
                    privateFun.fireMessage('0', 'duplicate record found in object...');
                    $scope.isPendingRequest = false;
                    return;
                }
                isFoundCnd = false;
            }

            if (!isFoundCnd) {
                var obj = {
                    filedName: filed.filedName,
                    condition: row.name
                };
                executeQryData.executeMeasures.push(obj);
                eval("$scope." + $scope.selectedChart.chartType + ".selectCondition()");
            }

        },
        onClickColumn: function (column) {
            $("#togglePanelColumns").hide(200);
            $scope.isPendingRequest = true;
            $scope.eventHndler.isToggleColumns = false;

            var isFoundCnd = false;
            for (i in executeQryData.executeColumns) {
                if (executeQryData.executeColumns[i].filedName == column.filedName) {
                    isFoundCnd = true;
                    //alert('duplicate record found in object...');
                    privateFun.fireMessage('0', 'duplicate record found in object...');
                    $scope.isPendingRequest = false;
                    return;
                }
                isFoundCnd = false;
            }

            if (!isFoundCnd) {
                var seriesArr = $scope.executeQryData.executeMeasures;
                if (seriesArr.length > 0) {

                    eval("$scope." + $scope.selectedChart.chartType + ".selectAttribute(column.filedName)");

                } else {
                    //alert("First select atleast one measure");
                    privateFun.fireMessage('0', 'First select atleast one measure');
                    $scope.isPendingRequest = false;
                }

            }
        },

        onClickRmvCondition: function (condition, measure) {
            //alert('record delete function...' + JSON.stringify(condition) + " " + JSON.stringify(measure));
            privateFun.fireMessage('0', 'record delete function...' + JSON.stringify(condition) + " " + JSON.stringify(measure));
            $scope.isPendingRequest = false;
        },
        onClickApply: function () {
            this.isLoadingChart = true;
            if (this.isToggleMeasure) {
                $("#togglePanel").hide(200);
                this.isToggleMeasure = false;
            } else {
                $("#togglePanel").show(300);
                this.isToggleMeasure = true;
            }
            setTimeout(function () {
                this.isLoadingChart = false;
            }, 1000);
        },
        onClickSetting: function (tabNo) {
            switch (tabNo) {
                case '1':
                    //#chart setting
                    //click chart setting
                    if (this.openSettingToggle[0].isChart) {
                        this.hideVisualizationType();
                    } else {
                        $("#toggleSettingPanel").addClass('chart-tab');
                        this.openSettingToggle[0].isChart = true;
                        $("#toggleSettingPanel").show(300);

                        if (this.openSettingToggle[1].isStructuret) {
                            this.hideDataStructure();
                        }
                        if (this.openSettingToggle[2].isChart) {
                            this.hideChartSettings();
                        }
                        if (this.openSettingToggle[1].isQueryBuilder) {
                            this.hideDesignQuery();
                        }
                    }
                    break;
                case '2':
                    //#data structure
                    //Data Structure
                    if (this.openSettingToggle[1].isStructuret) {
                        this.hideDataStructure();
                    } else {
                        $("#toggleStructurePanel").addClass('structure-tab');
                        this.openSettingToggle[1].isStructuret = true;
                        $("#toggleStructurePanel").show(300);

                        if (this.openSettingToggle[0].isChart) {
                            this.hideVisualizationType();
                        }
                        if (this.openSettingToggle[2].isChart) {
                            this.hideChartSettings();
                        }
                        if (this.openSettingToggle[1].isQueryBuilder) {
                            this.hideDesignQuery();
                        }
                    }
                    break;
                case '3':
                    if (this.openSettingToggle[2].isChart) {
                        this.hideChartSettings();
                    } else {
                        $("#toggleSerSettingsPanel").addClass('ser-setting-tab');
                        this.openSettingToggle[2].isChart = true;
                        $("#toggleSerSettingsPanel").show(300);

                        if (this.openSettingToggle[0].isChart) {
                            this.hideVisualizationType();
                        }
                        if (this.openSettingToggle[1].isStructuret) {
                            this.hideDataStructure();
                        }
                        if (this.openSettingToggle[1].isQueryBuilder) {
                            this.hideDesignQuery();
                        }
                    }
                    break;
                case '4':
                    //save
                    eval("$scope." + $scope.selectedChart.chartType + ".saveWidget($scope.widget)");
                    break;
                case '5':
                    //#create query builder
                    //query builder
                    if (this.openSettingToggle[1].isQueryBuilder) {
                        this.hideDesignQuery();
                    } else {
                        $("#toggleQueryBuilder").addClass('design-tab');
                        this.openSettingToggle[1].isQueryBuilder = true;
                        $("#toggleQueryBuilder").show(300);

                        if (this.openSettingToggle[0].isChart) {
                            this.hideVisualizationType();
                        }
                        if (this.openSettingToggle[1].isStructuret) {
                            this.hideDataStructure();
                        }
                        if (this.openSettingToggle[2].isChart) {
                            this.hideChartSettings();
                        }
                        if (this.isToggleMeasure) {
                            $("#togglePanel").hide(200);
                            this.isToggleMeasure = false;
                        }
                        if (this.isToggleColumns) {
                            $("#togglePanelColumns").hide(200);
                            this.isToggleColumns = false;
                        }
                    }
                    break;
            }

        },
        //hide dialog boxes
        hideVisualizationType: function () {
            $("#toggleSettingPanel").hide(200);
            setTimeout(function () {
                $("#toggleSettingPanel").removeClass('chart-tab');
            }, 200);
            this.openSettingToggle[0].isChart = false;
        },
        hideDataStructure: function () {
            $("#toggleStructurePanel").hide(200);
            setTimeout(function () {
                $("#toggleStructurePanel").removeClass('structure-tab');
            }, 200);
            this.openSettingToggle[1].isStructuret = false;
        },
        hideChartSettings: function () {
            $("#toggleSerSettingsPanel").hide(200);
            setTimeout(function () {
                $("#toggleSerSettingsPanel").removeClass('ser-setting-tab');
            }, 200);
            this.openSettingToggle[2].isChart = false;
        },
        hideDesignQuery: function () {
            $("#toggleQueryBuilder").hide(200);
            setTimeout(function () {
                $("#toggleQueryBuilder").removeClass('design-tab');
            }, 200);
            this.openSettingToggle[1].isQueryBuilder = false;
        },
        onClickSelectedChart: function (data, onSelect) {

            //remove highcharts related configs
            if (onSelect.chartType != 'metric' && onSelect.chartType != 'highCharts') {
                $scope.dynFlex = 90;
                $scope.chartWrapStyle.height = 'calc(91vh)';
            }
            else {
                $scope.dynFlex = 70;
                $scope.chartWrapStyle.height = 'calc(55vh)';
            }

            var i;
            var chartInData = data;
            for (i = 0; i < chartInData.length; i++) {
                chartInData[i].selected = false;
            }
            onSelect.selected = true;
            $scope.executeQryData.chartType = onSelect.chart;
            $scope.chartType = onSelect.chart;

            if ($scope.selectedChart.chartType != onSelect.chartType) {
                $scope.executeQryData.executeColumns = [];
                $scope.executeQryData.executeMeasures = [];
            }
            $scope.selectedChart = onSelect;
            eval("$scope." + $scope.selectedChart.chartType + ".changeType()");
            //privateFun.createHighchartsChart(onSelect.chart);
        },
        onClickDownload: function () {
            // var htmlElement = document.getElementsByClassName("highcharts-container")[0];
            var htmlElement = document.getElementById("d3Sunburst");
            html2canvas(htmlElement, {
                onrendered: function (canvas) {
                    var button = document.getElementById('downloadImage');
                    button.addEventListener('click', function (e) {
                        var dataURL = canvas.toDataURL('image/png');
                        button.href = dataURL;
                    });
                },
                width: 1000,
                height: 1000
            });
        }
    } //end event function


    $scope.saveChart = function (widget) {

        var widgetLimit = 6;

        if ($rootScope.dashboard.widgets.length < widgetLimit) {

            widget.widName = $scope.widget.widName;
            widget.dataCtrl = "widgetSettingsDataCtrl";
            widget.dataView = "views/ViewData.html";
            widget["selectedChart"] = $scope.selectedChart;
            widget.highchartsNG["size"] = {
                width: 300,
                height: 220
            };
            if (typeof widget.commonSrc == "undefined") {
                // widget.highchartsNG["size"] = {
                //     width: 300,
                //     height: 220
                // };
                widget["commonSrc"] = {
                    src: $scope.sourceData,
                    mea: $scope.executeQryData.executeMeasures,
                    att: $scope.executeQryData.executeColumns,
                    query: $scope.receivedQuery
                };
                $rootScope.dashboard.widgets.push(widget);
            } else {
                // $scope.widget.highchartsNG["size"] = $scope.prevChartSize;
                $scope.widget["commonSrc"] = {
                    src: $scope.sourceData,
                    mea: $scope.executeQryData.executeMeasures,
                    att: $scope.executeQryData.executeColumns,
                    query: $scope.receivedQuery
                };
                var objIndex = getRootObjectById(widget.id, $rootScope.dashboard.widgets);
                $rootScope.dashboard.widgets[objIndex] = widget;
            }

            console.log("$rootScope.dashboard.widgets", $rootScope.dashboard.widgets);

            $scope.eventHndler.isMainLoading = true;
            $scope.eventHndler.message = $scope.eventHndler.messageAry[0];
            setTimeout(function () {
                $scope.eventHndler.isMainLoading = false;
                $state.go('home.Dashboards');
            }, 5000);
        }
        else {
            privateFun.fireMessage('0', 'Maximum Widget Limit Exceeded');
        }
    };

    //chart functions
    $scope.highCharts = {
        onInit: function (recon) {
            if (!recon)
                $scope.highchartsNG = $scope.selectedChart.initObj;
            else {
                $scope.highchartsNG = $scope.widget.highchartsNG;
                $scope.highchartsNG.series.forEach(function (key) {
                    $scope.recordedColors[key.origName] = key.color;
                });
                $scope.isDrilled = $scope.widget.widData.drilled;
                if ($scope.isDrilled) $scope.drillDownConf = $scope.widget.widData.drillConf;
                $scope.prevChartSize = angular.copy($scope.highchartsNG.size);
                delete $scope.highchartsNG.size;
            }
        },
        changeType: function () {
            $scope.highchartsNG.options.chart.type = $scope.selectedChart.chart;
        },
        selectCondition: function () {
            if (!$scope.isDrilled || $scope.executeQryData.executeColumns.length == 0) {
                $scope.getAggregation();
            } else {
                if ($scope.executeQryData.executeMeasures.length >= 1) {
                    $scope.getDrilledAggregation();
                } else {
                    $scope.executeQryData.executeMeasures.pop();
                    eval("$scope." + $scope.selectedChart.chartType + ".onGetGrpAggData()");
                    //alert("drilldown only supports single series");
                    privateFun.fireMessage('0', 'drilldown only supports single series');
                    $scope.isPendingRequest = false;
                }
            }
        },
        selectAttribute: function (fieldName) {
            if (!$scope.isDrilled || $scope.executeQryData.executeColumns.length == 0) {
//                if($scope.executeQryData.executeColumns.length == 0){
                $scope.executeQryData.executeColumns = [{
                    filedName: fieldName
                }];
                $scope.getGroupedAggregation(fieldName);
            }
            // else if($scope.executeQryData.executeColumns.length == 2){
            //     eval("$scope." + $scope.selectedChart.chartType + ".onGetGrpAggData()");
            //     // alert("drilldown only supports for two levels"); 
            //     privateFun.fireMessage('0','drilldown only supports for two levels');
            //     $scope.isPendingRequest = false;               
            // }
            else if ($scope.executeQryData.executeColumns.length >= 1) {
                $scope.executeQryData.executeColumns.push({
                    filedName: fieldName
                });
                $scope.getDrilledAggregation();
            }

        },
        executeQuery: function (cat, res, query) {
            if (cat != "") {
                $scope.executeQryData.executeColumns = [{
                    filedName: cat
                }];
                $scope.mapResult(cat, res, function (data) {
                    $scope.highchartsNG.series = data;
                    $scope.highchartsNG.series.forEach(function (key) {
                        if (key.data.length > 1000)
                            key['turboThreshold'] = key.data.length;
                    });
                    $scope.eventHndler.isLoadingChart = false;
                    $scope.receivedQuery = query;
                    $scope.queryEditState = false;
                });
            } else {
                $scope.setMeasureData(res[0]);
                $scope.receivedQuery = query;
            }
        },
        removeMea: function (l) {
            if (l > 0) $scope.getAggregation();
            else {
                //$scope.eventHndler.isLoadingChart = false;
                $scope.executeQryData.executeColumns = [];
                $scope.highchartsNG = $scope.selectedChart.initObj;
            }
        },
        removeCat: function () {
            if ($scope.isDrilled) $scope.getDrilledAggregation();
            else $scope.getAggregation();
        },
        onGetAggData: function (res) {
            $scope.isPendingRequest = false;
            $scope.setMeasureData(res);
        },
        onGetGrpAggData: function () {
            $scope.isPendingRequest = false;
        },
        saveWidget: function (wid) {
            wid.highchartsNG = $scope.highchartsNG;
            wid.widData['drilled'] = $scope.isDrilled;
            if ($scope.isDrilled) wid.widData['drillConf'] = $scope.drillDownConf;
            wid.widView = "views/common-data-src/res-views/ViewCommonSrc.html";
            wid.initCtrl = "elasticInit";
            $scope.saveChart(wid);
        }
    };


    $scope.forecast = {
        onInit: function (recon) {
            $scope.highchartsNG = $scope.widget.highchartsNG;
            $scope.prevChartSize = angular.copy($scope.highchartsNG.size);
            delete $scope.highchartsNG.size;
        },
        changeType: function () {
            var mergedArr = $scope.sourceData.fMeaArr.concat($scope.sourceData.fAttArr);
            var field_d, field_f = "";
            var fObj = {
                model: "Additive",
                pred_error_level: 0.0001,
                alpha: 0,
                beta: 53,
                gamma: 34,
                fcast_days: 30,
                tbl: $scope.sourceData.tbl,
                field_name_d: "",
                field_name_f: "",
                steps_pday: 1,
                m: 7,
                interval: "Daily"
            };
            mergedArr.forEach(function (k) {
                if (k.dataType == "TIMESTAMP" || k.dataType == "datetime") {
                    $scope.forecastObj.paramObj.field_name_d = k.name;
                } else {
                    $scope.forecastObj.paramObj.field_name_f = k.name;
                }
            });

            $scope.generateForecast($scope.forecastObj.paramObj);
        },
        saveWidget: function (wid) {
            wid.highchartsNG = $scope.highchartsNG;
            wid.widView = "views/common-data-src/res-views/ViewCommonSrc.html";
            wid.initCtrl = "elasticInit";
            $scope.saveChart(wid);
        }
    };

    $scope.$watch("forecastObj.paramObj", function (newValue, oldValue) {
        if (newValue != oldValue) {
            $scope.generateForecast(newValue);
        }
    }, true);

    $scope.generateForecast = function (fObj) {
        $scope.eventHndler.isLoadingChart = true;
        $scope.client.getForcast(fObj, function (data, status) {
            var mainSerObj = [];
            if (status) {
                data.forEach(function (key) {
                    switch (key.target) {
                        case "RMSE":
                            break;
                        case "TotalForecastedVal":
                            break;
                        default:
                            var serObj = [];
                            key.datapoints.forEach(function (val) {
                                var dArr = val[1].split('-');
                                serObj.push([
                                    Date.UTC(parseInt(dArr[0]), parseInt(dArr[1]) - 1, parseInt(dArr[2])),
                                    val[0]
                                ]);
                            });
                            mainSerObj.push({
                                name: key.target,
                                data: serObj
                            });
                    }
                });
                console.log(JSON.stringify(mainSerObj));
                $scope.highchartsNG = {};
                $scope.highchartsNG['options'] = {
                    chart: {
                        zoomType: 'x'
                    }
                };
                $scope.highchartsNG['xAxis'] = {type: 'datetime'};
                $scope.highchartsNG.series = mainSerObj;
                $scope.eventHndler.isLoadingChart = false;


            } else {

            }
        });
    };

    $scope.boxplot = {
        changeType: function () {
            var meaArr = $scope.sourceData.fMeaArr;
            var dataTypeFlag = true;
            meaArr.forEach(function (k) {
                if (k.dataType == "TIMESTAMP" || k.dataType == "datetime") {
                    dataTypeFlag = false;
                }
            });

            if (dataTypeFlag && $scope.sourceData.fAttArr.length == 0) {
                $scope.eventHndler.isLoadingChart = true;

                var fieldArray = [];

                for (var i = 0; i < $scope.commonData.measures.length; i++) {
                    fieldArray.push("'" + $scope.commonData.measures[i].filedName + "'");
                }
                for (var i = 0; i < $scope.commonData.columns.length; i++) {
                    fieldArray.push("'" + $scope.commonData.columns[i].filedName + "'");
                }

                //get highest level
                $scope.client.generateboxplot($scope.sourceData.tbl, fieldArray.toString(), function (data, status) {
                    var hObj = {};
                    $scope.dataforeachBox = []
                    $scope.dataOutliers = [];

                    $scope.plotCategories = [];
                    $scope.observationsData = [];
                    var i = 0;

                    if (status) {
                        for (var key in data) {
                            if (Object.prototype.hasOwnProperty.call(data, key)) {
                                $scope.plotCategories.push(key);
                                $scope.observationsData.push([
                                    data[key].l_w,
                                    data[key].quartile_1,
                                    data[key].quartile_2,
                                    data[key].quartile_3,
                                    data[key].u_w
                                ]);
                                data[key].outliers.forEach(function (k) {
                                    $scope.dataOutliers.push([i, k]);
                                });
                                i++;
                            }
                        }

                        $scope.eventHndler.isLoadingChart = false;
                        $scope.widget.highchartsNG = {
                            options: {
                                chart: {
                                    type: 'boxplot',
                                    // Explicitly tell the width and height of a chart
                                    width: null,
                                    height: 367,
                                }
                            },
                            title: {
                                text: $scope.widget.widName
                            },

                            xAxis: {
                                categories: $scope.plotCategories,
                                title: {
                                    text: 'Selected Fields'
                                }
                            },

                            yAxis: {
                                title: {
                                    text: 'Observations'
                                },
                            },
                            credits: {
                                enabled: false
                            },
                            legend: {
                                enabled: false
                            },

                            plotOptions: {
                                boxplot: {
                                    // Enabling this option overrides the fillColor property
                                    colorByPoint: true,
                                    fillColor: '#F0F0E0',
                                    lineWidth: 2,
                                    medianColor: '#0C5DA5',
                                    medianWidth: 3,
                                    stemColor: '#A63400',
                                    stemDashStyle: 'dot',
                                    stemWidth: 1,
                                    whiskerColor: '#3D9200',
                                    whiskerLength: '20%',
                                    whiskerWidth: 3
                                }
                            },
                            series: [{
                                name: 'Observations',
                                data: $scope.observationsData,
                                tooltip: {
                                    headerFormat: '<em>Experiment No {point.key}</em><br/>'
                                }
                            }, {
                                name: 'Outlier',
                                color: Highcharts.getOptions().colors[0],
                                type: 'scatter',
                                data: $scope.dataOutliers,
                                marker: {
                                    fillColor: 'white',
                                    lineWidth: 1,
                                    lineColor: Highcharts.getOptions().colors[0]
                                },
                                tooltip: {
                                    pointFormat: 'Observation: {point.y}'
                                }
                            }]
                        };
                    } else {
                    }
                });

            } else {
                privateFun.fireMessage('0', 'Please select only numeric values to create bloxplot');
            }
        },
        saveWidget: function (wid) {
            wid["widData"] = {
                value: $scope.selectedChart.initObj.value,
                label: $scope.selectedChart.initObj.label
            };

            wid.widView = "views/query/chart-views/BoxPlot.html";
            $scope.saveChart(wid);
        }


    }
    $scope.bubble = {
        changeType: function () {
            $scope.eventHndler.isLoadingChart = true;

            var fieldArray = [];

            for (var i = 0; i < $scope.commonData.measures.length; i++) {
                fieldArray.push("'" + $scope.commonData.measures[i].filedName + "'");
            }
            for (var i = 0; i < $scope.commonData.columns.length; i++) {
                fieldArray.push("'" + $scope.commonData.columns[i].filedName + "'");
            }

            //get highest level
            $scope.client.generateBubble($scope.sourceData.tbl, $scope.commonData.measures[0].filedName, $scope.commonData.measures[1].filedName, $scope.commonData.columns[0].filedName, function (data, status) {
                var hObj = {};
                $scope.axisforbubble = []
                $scope.seriesforBubble = [];
                $scope = [];
                if (status) {

                    $scope.categories = fieldArray;
                    $scope.eventHndler.isLoadingChart = false;

                    $scope.widget.highchartsNG = {
                        options: {
                            chart: {
                                type: 'bubble',
                                width: null,
                                height: 367,
                                zoomType: 'xy'
                            }
                        },
                        title: {
                            text: $scope.widget.widName
                        },

                        xAxis: {
                            categories: $scope.dataforbubble,
                            title: {
                                text: 'Selected Fields'
                            }
                        },

                        yAxis: {
                            title: {
                                text: 'Values'
                            }
                        },
                        credits: {
                            enabled: false
                        },
                        legend: {
                            enabled: false
                        },
                        plotOptions: {
                            bubble: {
                                dataLabels: {
                                    enabled: true,
                                    style: {
                                        textShadow: 'none'
                                    },
                                    formatter: function () {
                                        return this.point.name;
                                    }
                                },
                                minSize: '10%',
                                maxSize: '30%'
                            }
                        },


                        series: [{
                            name: 'Women',
                            marker: {
                                fillColor: 'pink'
                            },
                            data: [{
                                name: 'Alice',
                                x: 3.5,
                                y: 4,
                                z: 5
                            }, {
                                name: 'Eve',
                                x: 7,
                                y: 7,
                                z: 3
                            }, {
                                name: 'Carol',
                                x: 4,
                                y: 8,
                                z: 6
                            }]
                        }, {
                            name: 'Men',
                            marker: {
                                fillColor: 'lightblue'
                            },
                            data: [{
                                name: 'Dan',
                                x: 4,
                                y: 3,
                                z: 4
                            }, {
                                name: 'Bob',
                                x: 5,
                                y: 6,
                                z: 3
                            }, {
                                name: 'Frank',
                                x: 3,
                                y: 2,
                                z: 7
                            }]
                        }]
                    };
                } else {
                }
            });
        },
        saveWidget: function (wid) {
            wid["widData"] = {
                value: $scope.selectedChart.initObj.value,
                label: $scope.selectedChart.initObj.label
            };
            wid.widView = "views/query/chart-views/bubble.html";
            $scope.saveChart(wid);
        }


    }


    $scope.histogram = {
        changeType: function () {
            var meaArr = $scope.sourceData.fMeaArr;
            var dataTypeFlag = true;
            meaArr.forEach(function (k) {
                if (k.dataType == "TIMESTAMP" || k.dataType == "datetime") {
                    dataTypeFlag = false;
                }
            });

            if (dataTypeFlag && $scope.sourceData.fAttArr.length == 0) {
                $scope.eventHndler.isLoadingChart = true;
                $scope.histogramPlot = []

                var fieldArray = [];

                for (var i = 0; i < $scope.commonData.measures.length; i++) {
                    fieldArray.push("'" + $scope.commonData.measures[i].filedName + "'");
                }
                for (var i = 0; i < $scope.commonData.columns.length; i++) {
                    fieldArray.push("'" + $scope.commonData.columns[i].filedName + "'");
                }

                //get highest level
                $scope.client.generatehist($scope.sourceData.tbl, fieldArray.toString(), function (data, status) {
                    var hObj = {};
                    if (status) {
                        $scope.histogramPlotcat = [];
                        $scope.histogramPlotData = [];

                        for (var key in data) {
                            if (Object.prototype.hasOwnProperty.call(data, key)) {
                                for (var k in data[key]) {
                                    if (Object.prototype.hasOwnProperty.call(data[key], k)) {
                                        $scope.histogramPlotcat.push(k);
                                        $scope.histogramPlotData.push(data[key][k]);
                                    }
                                }
                            }
                        }

                        $scope.categories = fieldArray;
                        $scope.eventHndler.isLoadingChart = false;

                        $scope.widget.highchartsNG = {
                            options: {
                                chart: {
                                    type: 'column',
                                    // Explicitly tell the width and height of a chart
                                    width: null,
                                    height: 367,
                                }
                            },
                            title: {
                                text: 'Basic drilldown'
                            },

                            xAxis: {
                                title: {
                                    text: fieldArray[0]
                                },
                                categories: $scope.histogramPlotcat,
                                labels: {
                                    rotation: -90,
                                    y: 40,
                                    style: {
                                        fontSize: '8px',
                                        fontWeight: 'normal',
                                        color: '#333'
                                    },
                                },
                                lineWidth: 0,
                                lineColor: '#999',
                                tickLength: 70,
                                tickColor: '#ccc',
                            },
                            plotOptions: {
                                column: {
                                    shadow: false,
                                    borderWidth: .5,
                                    borderColor: '#666',
                                    pointPadding: 0,
                                    groupPadding: 0,
                                    color: 'rgba(204,204,204,.85)'
                                },
                                spline: {
                                    shadow: false,
                                    marker: {
                                        radius: 1
                                    }
                                },
                                areaspline: {
                                    color: 'rgb(69, 114, 167)',
                                    fillColor: 'rgba(69, 114, 167,.25)',
                                    shadow: false,
                                    marker: {
                                        radius: 1
                                    }
                                }
                            },
                            yAxis: {
                                title: {
                                    text: 'Count'
                                },
                                //maxPadding:0,
                                gridLineColor: '#e9e9e9',
                                tickWidth: 1,
                                tickLength: 3,
                                tickColor: '#ccc',
                                lineColor: '#ccc',
                                tickInterval: 25,
                                //endOnTick:false,
                            },

                            series: [{
                                data: $scope.histogramPlotData,
                                pointWidth: 70
                            }]
                        };
                    } else {
                    }
                });
            } else {
                privateFun.fireMessage('0', 'Please select only numeric values to create histogram');
            }
        },
        saveWidget: function (wid) {
            wid["widData"] = {
                value: $scope.selectedChart.initObj.value,
                label: $scope.selectedChart.initObj.label
            };

            wid.widView = "views/query/chart-views/histogram.html";
            $scope.saveChart(wid);
        }


    };

    $scope.d3hierarchy = {
        onInit: function (recon) {
            $scope.hierarData = $scope.widget.widData;
        },
        changeType: function () {
            $scope.eventHndler.isLoadingChart = true;

            var fieldArray = [];

            for (var i = 0; i < $scope.commonData.measures.length; i++) {
                fieldArray.push("'" + $scope.commonData.measures[i].filedName + "'");
            }
            for (var i = 0; i < $scope.commonData.columns.length; i++) {
                fieldArray.push("'" + $scope.commonData.columns[i].filedName + "'");
            }

            //get highest level
            $scope.client.getHighestLevel($scope.sourceData.tbl, fieldArray.toString(), function (data, status) {
                var hObj = {};
                if (status) {
                    data.forEach(function (entry) {
                        hObj[entry.value] = entry.level;
                    });
                    $scope.client.getHierarchicalSummary($scope.sourceData.tbl, JSON.stringify(hObj), function (data, status) {
                        if (status) {
                            $scope.hierarData = data;
                            $scope.eventHndler.isLoadingChart = false;
                        } else {
                        }
                    });
                } else {
                }
            });
        },

        saveWidget: function (wid) {
            wid.widView = "views/ViewHnbData.html";
            wid.widData = $scope.hierarData;
            $scope.saveChart(wid);
        }
    };

    $scope.d3sunburst = {
        onInit: function (recon) {
            $scope.hierarData = $scope.widget.widData;
            $scope.$apply;
        },
        changeType: function () {
            $scope.eventHndler.isLoadingChart = true;

            var fieldArray = [];

            for (var i = 0; i < $scope.commonData.measures.length; i++) {
                fieldArray.push("'" + $scope.commonData.measures[i].filedName + "'");
            }
            for (var i = 0; i < $scope.commonData.columns.length; i++) {
                fieldArray.push("'" + $scope.commonData.columns[i].filedName + "'");
            }

            //get highest level
            $scope.client.getHighestLevel($scope.sourceData.tbl, fieldArray.toString(), function (data, status) {
                var hObj = {};
                if (status) {
                    data.forEach(function (entry) {
                        hObj[entry.value] = entry.level;
                    });
                    $scope.client.getHierarchicalSummary($scope.sourceData.tbl, JSON.stringify(hObj), function (data, status) {
                        $scope.hierarData = data;
                        $scope.eventHndler.isLoadingChart = false;
                        if (status) {
                            $scope.hierarData = data;
                            $scope.eventHndler.isLoadingChart = false;
                        } else {
                        }
                    });
                } else {
                }
            });
        },

        saveWidget: function (wid) {
            wid.widView = "views/ViewHnbMonth.html";
            wid.widData = $scope.hierarData;
            $scope.saveChart(wid);
        }

    };

    $scope.pivotSummary = {
        onInit: function (recon) {

        },
        changeType: function () {
            $scope.eventHndler.isLoadingChart = true;
            $scope.fieldArray = [];

            for (var i = 0; i < $scope.commonData.measures.length; i++) {
                $scope.fieldArray.push($scope.commonData.measures[i].filedName);
            }
            for (var i = 0; i < $scope.commonData.columns.length; i++) {
                $scope.fieldArray.push($scope.commonData.columns[i].filedName);
            }
            console.log($scope.fieldArray);
            var parameter;
            $scope.fieldArray.forEach(function (entry) {
                if (i == 0) {
                    parameter = entry
                } else {
                    parameter += "," + entry;
                }
                i++;
            });

            var query = "SELECT " + $scope.fieldArray.toString() + " FROM Demo." + $scope.sourceData.tbl;
            $scope.client.getExecQuery(query, function (data, status) {
                $scope.summaryData = data;
                $scope.eventHndler.isLoadingChart = false;
            }, $scope.initRequestLimit.value);
        },
        saveWidget: function (wid) {
            wid.widView = "views/ViewPivotSummary.html";
            wid.widData.summary = $scope.summaryData;
            wid.widData.fieldArray = $scope.fieldArray;
            wid.uniqueType = "Pivot Summary";
            wid.initCtrl = "";
            $scope.saveChart(wid);
        }
    };

    $scope.googleMap = {
        onInit: function (recon) {

        },
        changeType: function () {
            // $scope.commonData.chartTypes[17].view = "views/googleMaps/ViewGoogleMapsBranches.html";
        },
        saveWidget: function (wid) {
            wid.widView = "views/googleMaps/ViewGoogleMapsBranches.html";
            wid.uniqueType = "Google Maps Branches";
            $scope.saveChart(wid);
        }
    };

    $scope.selectedFields = [];

    $scope.drawPivotSummary = function () {

        console.log("$scope", $scope);

        $scope.initChart = $scope.commonData.chartTypes[15];

        $scope.selectedFields = $rootScope.pivotSummaryData;
        $scope.products = [];
        product = {};
        for (var i = 0; i < $scope.selectedFields.length; i++) {
            var data = $scope.selectedFields[i],
                product = {};
            for (var j = 0; j < $scope.fieldArray.length; j++) {
                var field = $scope.fieldArray[j];
                product[field] = data[field];
            }
            $scope.products.push(product);
        }

        var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.gchart_renderers, $.pivotUtilities.d3_renderers);
        $("#grid").pivotUI($scope.products, {
            // renderers: renderers,
            rows: [$scope.selectedFields[0]],
            cols: [$scope.selectedFields[1]],

            // rendererName: "Table"         
        });

    }

    $scope.metric = {
        onInit: function (recon) {
            $scope.selectedChart.initObj = {
                value: $scope.sourceData.wid.widData.value,
                label: $scope.sourceData.wid.widData.label
            };
            // $scope.highchartsNG = $scope.widget.highchartsNG;
            // $scope.prevChartSize = angular.copy($scope.highchartsNG.size);
            $scope.prevChartSize = {width: 300, height: 220};
        },
        changeType: function () {
            //$scope.highchartsNG.options.chart.type = $scope.selectedChart.chart;
        },
        selectCondition: function () {
            $scope.getAggregation();
        },
        selectAttribute: function (fieldName) {
            //$scope.getGroupedAggregation(fieldName);
            // alert("grouping in metric is not supported");
            privateFun.fireMessage('0', 'grouping in metric is not supported');
            $scope.isPendingRequest = false;
        },
        executeQuery: function (cat, res, query) {
            for (var c in res[0]) {
                if (Object.prototype.hasOwnProperty.call(res[0], c)) {
                    $scope.selectedChart.initObj.decValue = res[0][c];
                    $scope.selectedChart.initObj.value = convertDecimals(res[0][c], 2);
                    $scope.selectedChart.initObj.label = c;
                }
            }
            $scope.eventHndler.isLoadingChart = false;
            $scope.receivedQuery = query;
        },
        removeMea: function (l) {
            if (l > 0) $scope.getAggregation();
            else {
                // $scope.eventHndler.isLoadingChart = false;
                $scope.executeQryData.executeColumns = [];
                $scope.highchartsNG = $scope.selectedChart.initObj;
            }
        },
        removeCat: function () {
            $scope.getAggregation();
        },
        onGetAggData: function (res) {

            for (var c in res) {
                $scope.isPendingRequest = false;
                if (Object.prototype.hasOwnProperty.call(res, c)) {
                    $scope.selectedChart.initObj.decValue = res[c];
                    $scope.selectedChart.initObj.value = convertDecimals(res[c], parseInt($scope.selectedChart.initObj.dec));
                    $scope.selectedChart.initObj.label = c;
                }
            }
            $scope.eventHndler.isLoadingChart = false;
        },
        saveWidget: function (wid) {
            wid["widData"] = {
                decValue: $scope.selectedChart.initObj.decValue,
                dec: $scope.selectedChart.initObj.dec,
                scale: $scope.selectedChart.initObj.scale,
                value: $scope.selectedChart.initObj.value,
                label: $scope.selectedChart.initObj.label
            };
            wid.widView = "views/common-data-src/res-views/ViewCommonSrcMetric.html";
            $scope.saveChart(wid);
        }
    };


    $scope.getAggregation = function () {
        $scope.eventHndler.isLoadingChart = true;
        if (typeof $scope.highchartsNG["init"] == "undefined" || !$scope.highchartsNG.init) {
            $scope.highchartsNG["init"] = false;
            $scope.highchartsNG = {};
            $scope.highchartsNG = {
                options: {
                    chart: {
                        type: $scope.chartType == '' ? 'bar' : $scope.chartType,
                        // Explicitly tell the width and height of a chart
                        width: null,
                        height: 367,
                    }
                },
                title: {
                    text: $scope.widget.widName
                },
                plotOptions: {},
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'middle',
                    borderWidth: 0
                },
                xAxis: {
                    type: 'category'
                },
                credits: {
                    enabled: false
                },
                colors: ['#EC784B'],
                series: []
            };
        }
        var row = "";

        if ($scope.executeQryData.executeColumns.length == 0) {
            var meaArr = executeQryData.executeMeasures;
            var fieldArr = [];
            $scope.eventHndler.isLoadingChart = true;
            meaArr.forEach(function (key) {
                fieldArr.push({
                    field: key.filedName,
                    agg: key.condition
                });
            });

            $scope.client.getAggData($scope.sourceData.tbl, fieldArr, function (res, status, query) {
                if (status) {
                    eval("$scope." + $scope.selectedChart.chartType + ".onGetAggData(res[0])");
                    $scope.receivedQuery = query;
                } else {
                    // alert('request failed');
                    privateFun.fireMessage('0', 'request failed');
                    $scope.isPendingRequest = false;
                    $scope.eventHndler.isLoadingChart = false;
                }
            });


        } else {
            row = $scope.executeQryData.executeColumns[0].filedName;
            $scope.getGroupedAggregation(row);
        }

        //alert('test');
    };

    $scope.setMeasureData = function (res) {
        $scope.highchartsNG.series = [];
        $scope.serColor = "";
        for (var c in res) {
            if (Object.prototype.hasOwnProperty.call(res, c)) {
                typeof $scope.recordedColors[c] == "undefined" ? serColor = "#EC784B" : serColor = $scope.recordedColors[c];
                $scope.highchartsNG.series.push({
                    name: c,
                    color: serColor,
                    data: [res[c]]
                })
            }
        }
        $scope.eventHndler.isLoadingChart = false;
    };

    $scope.getGroupedAggregation = function (row) {
        if (row) $scope.selectedCat = row;
        $scope.highchartsNG.series = [];
        var fieldArr = [];
        $scope.eventHndler.isLoadingChart = true;

        var measureArr = $scope.executeQryData.executeMeasures;
        measureArr.forEach(function (key) {
            fieldArr.push({
                field: key.filedName,
                agg: key.condition
            });
        });

        $scope.client.getAggData($scope.sourceData.tbl, fieldArr, function (res, status, query) {
            if (status) {
//                console.log(JSON.stringify(res));
                $scope.mapResult($scope.selectedCat, res, function (data) {
                    $scope.highchartsNG.series = data;
                    $scope.highchartsNG.series.forEach(function (key) {
                        if (key.data.length > 1000)
                            key['turboThreshold'] = key.data.length;
                    });

                    $scope.eventHndler.isLoadingChart = false;
                    $scope.receivedQuery = query;
                    console.log(JSON.stringify($scope.highchartsNG));
                    eval("$scope." + $scope.selectedChart.chartType + ".onGetGrpAggData()");
                });
            } else {
                //alert('request failed');
                privateFun.fireMessage('0', 'request failed');
                $scope.isPendingRequest = false;
                $scope.eventHndler.isLoadingChart = false;
            }

        }, $scope.selectedCat);
    };

    /* <Async drilldown> */
    $scope.getDrilledAggregation = function () {
        var fieldArr = [];
        var catArr = [];
        var drillOrderArr = [];
        $scope.eventHndler.isLoadingChart = true;
        $scope.highchartsNG.series = [];
        $scope.highchartsNG['drilldown'] = {series: []};

        var measureArr = $scope.executeQryData.executeMeasures;
        measureArr.forEach(function (key) {
            fieldArr.push({
                field: key.filedName,
                agg: key.condition
            });
        });

        $scope.executeQryData.executeColumns.forEach(function (key) {
            catArr.push('"' + key.filedName + '"');
        });

        $scope.client.getHighestLevel($scope.sourceData.tbl, catArr.toString(), function (res, status) {
            if (status) {
                var highestLevel = "";
                for (i = 0; i < res.length; i++) {
                    if (typeof res[i + 1] != "undefined") {
                        drillOrderArr.push({
                            name: res[i].value,
                            nextLevel: res[i + 1].value,
                            level: res[i].level
                        });

                        if (res[i].level == 1) highestLevel = res[i].value;

                    } else {
                        drillOrderArr.push({
                            name: res[i].value,
                            level: res[i].level
                        });
                    }
                }

                $scope.client.getAggData($scope.sourceData.tbl, fieldArr, function (res, status, query) {
                    console.log(JSON.stringify(res));
                    var serObj = {};
                    for (var key in res[0]) {
                        if (Object.prototype.hasOwnProperty.call(res[0], key)) {
                            if (key != highestLevel) {
                                serObj[key] = {
                                    name: key,
                                    data: []
                                };
                            }
                        }
                    }

                    for (i = 0; i < res.length; i++) {
                        for (var key in res[i]) {
                            if (Object.prototype.hasOwnProperty.call(res[i], key)) {
                                if (key != highestLevel) {
                                    serObj[key].data.push({
                                        name: res[i][highestLevel],
                                        y: res[i][key],
                                        drilldown: true
                                    });
                                }
                            }
                        }
                    }

                    for (var key in serObj) {
                        if (Object.prototype.hasOwnProperty.call(serObj, key)) {
                            $scope.highchartsNG.series.push({
                                name: key,
                                data: serObj[key].data
                            });
                        }
                    }

                    //assigning the highest level query
                    $scope.receivedQuery = query;

                    $scope.drillDownConf = {
                        dataSrc: $scope.sourceData.src,
                        clientObj: $scope.client,
                        srcTbl: $scope.sourceData.tbl,
                        drillOrdArr: drillOrderArr,
                        highestLvl: highestLevel,
                        fields: fieldArr,
                        level1Query: query,
                        level2Query: null,
                        level3Query: null,
                        currentLevel: 1
                    };
                    $scope.highchartsNG.options['customVar'] = highestLevel;
                    $scope.highchartsNG.options.chart['events'] = {
                        drilldown: function (e) {
                            if (!e.seriesOptions) {
                                var srcTbl = $scope.sourceData.tbl,
                                    fields = fieldArr,
                                    drillOrdArr = drillOrderArr,
                                    chart = this,
                                    clientObj = $scope.client,
                                    clickedPoint = e.point.name,
                                    nextLevel = "",
                                    highestLvl = this.options.customVar,
                                    drillObj = {},
                                    isLastLevel = false;


                                for (i = 0; i < drillOrdArr.length; i++) {
                                    if (drillOrdArr[i].name == highestLvl) {
                                        nextLevel = drillOrdArr[i].nextLevel;
                                        if (!drillOrdArr[i + 1].nextLevel) isLastLevel = true;
                                    }
                                }

                                // Show the loading label
                                chart.showLoading("Retrieving data for '" + clickedPoint.toLowerCase() + "' grouped by '" + nextLevel + "'");

                                //aggregate method
                                clientObj.getAggData(srcTbl, fields, function (res, status, query) {

                                    if (status) {
                                        for (var key in res[0]) {
                                            if (Object.prototype.hasOwnProperty.call(res[0], key)) {
                                                if (key != nextLevel) {
                                                    drillObj = {
                                                        name: key,
                                                        data: []
                                                    };
                                                }
                                            }
                                        }

                                        res.forEach(function (key) {
                                            if (!isLastLevel) {
                                                drillObj.data.push({
                                                    name: key[nextLevel],
                                                    y: key[drillObj.name],
                                                    drilldown: true
                                                });
                                            } else {
                                                drillObj.data.push({
                                                    name: key[nextLevel],
                                                    y: key[drillObj.name]
                                                });
                                            }

                                        });

                                        chart.addSeriesAsDrilldown(e.point, drillObj);

                                    } else {
                                        alert('request failed due to :' + JSON.stringify(res));
                                        e.preventDefault();
                                    }
                                    console.log(JSON.stringify(res));
                                    chart.options.customVar = nextLevel;
                                    chart.hideLoading();
                                }, nextLevel, highestLvl + "='" + clickedPoint + "'");
                            }
                        },
                        drillup: function (e) {

                            var chart = this;
                            $scope.drillDownConf.drillOrdArr.forEach(function (key) {
                                if (key.nextLevel && key.nextLevel == chart.options.customVar)
                                    chart.options.customVar = key.name;
                            });
                        }
                    };

                    $scope.isPendingRequest = false;
                    $scope.eventHndler.isLoadingChart = false;

                }, highestLevel);

            } else {
                privateFun.fireMessage('0', res);
            }
        });
    };
    /* </Async drilldown> */

    $scope.getDrilledAggregation1 = function () {
        var fieldArr = [];
        var catArr = [];
        $scope.eventHndler.isLoadingChart = true;

        var measureArr = $scope.executeQryData.executeMeasures;
        measureArr.forEach(function (key) {
            fieldArr.push({
                field: key.filedName,
                agg: key.condition
            });
        });

        $scope.executeQryData.executeColumns.forEach(function (key) {
            catArr.push('"' + key.filedName + '"');
        });

        $scope.client.getHighestLevel($scope.sourceData.tbl, catArr.toString(), function (res, status) {
            if (status) {
                var serArr = [];
                var serMainArr = [];
                var drillObj = {};
                var drillSerMainArr = [];
                var i = 0, j = 0;
                syncDrill(i, res);
                function syncDrill(i, res) {
                    if (i < res.length) {
                        $scope.client.getAggData($scope.sourceData.tbl, fieldArr, function (res1, status, query) {
                            if (status) {
                                console.log(JSON.stringify(res1));
                                var serNameKey = "";
                                var serValKey = "";
                                for (var key in res1[0]) {
                                    if (Object.prototype.hasOwnProperty.call(res1[0], key)) {
                                        typeof res1[0][key] == "string" ? serNameKey = key : serValKey = key;
                                    }
                                }

                                for (k = 0; k < res1.length; k++) {
                                    serArr.push({
                                        name: res1[k][serNameKey],
                                        y: res1[k][serValKey],
                                        drilldown: res1[k][serNameKey]
                                    });
                                }

                                serMainArr.push({
                                    name: serValKey,
                                    data: serArr
                                });

                                console.log(JSON.stringify(serMainArr));
                                syncAgg(j, res1);
                                function syncAgg(j, res1) {
                                    if (j < res1.length) {
                                        var con = res[i].value + "='" + res1[j][res[i].value] + "'";
                                        var drillSerArr = [];
                                        $scope.client.getAggData($scope.sourceData.tbl, fieldArr, function (res2, status, query) {
                                            if (status) {
                                                var dserNameKey = "";
                                                var dserValKey = "";
                                                for (var key in res2[0]) {
                                                    if (Object.prototype.hasOwnProperty.call(res2[0], key)) {
                                                        typeof res2[0][key] == "string" ? dserNameKey = key : dserValKey = key;
                                                    }
                                                }
                                                console.log(JSON.stringify(res2));

                                                for (k = 0; k < res2.length; k++) {
                                                    drillSerArr.push({
                                                        name: res2[k][dserNameKey],
                                                        y: res2[k][dserValKey],
                                                        //drilldown: res2[k][dserNameKey]
                                                    });
                                                }

                                                drillSerMainArr.push({
                                                    name: dserValKey,
                                                    id: res1[j][res[i].value],
                                                    data: drillSerArr
                                                });

                                                console.log(JSON.stringify(drillSerMainArr));
                                                syncAgg(j + 1, res1);
                                            } else {
                                                //alert('request failed');
                                                privateFun.fireMessage('0', 'request failed');
                                                $scope.isPendingRequest = false;
                                            }
                                        }, res[i + 1].value, con);
                                    } else {
                                        $scope.highchartsNG.series = serMainArr;
                                        $scope.highchartsNG['drilldown'] = {series: drillSerMainArr};
                                        console.log(JSON.stringify($scope.highchartsNG));
                                        $scope.eventHndler.isLoadingChart = false;
                                        eval("$scope." + $scope.selectedChart.chartType + ".onGetGrpAggData()");
                                    }
                                };

                            } else {
                                // alert('request failed');
                                privateFun.fireMessage('0', 'request failed');
                                $scope.isPendingRequest = false;
                                $scope.eventHndler.isLoadingChart = false;
                            }

                        }, res[i].value);
                    } else {

                    }
                };
            } else {
                // alert('request failed');
                privateFun.fireMessage('0', 'request failed');
                $scope.isPendingRequest = false;
            }
        });
    };

    //#customer query design
    $scope.getExecuteAgg = function (query) {

        //  privateFun.isQrySyntaxError(query);
        if (typeof query != "undefined") {
            $scope.eventHndler.isLoadingChart = true;
            $scope.client.getExecQuery(query, function (res, status, query) {
                var cat = "";
                var measureArr = [];
                if (status) {
                    for (c in res[0]) {
                        if (Object.prototype.hasOwnProperty.call(res[0], c)) {
                            if (typeof res[0][c] == "string") cat = c;
                            else {
                                var m = c.split('_');
                                measureArr.push({
                                    filedName: m[1],
                                    condition: m[0]
                                });
                            }
                        }
                    }
                    $scope.executeQryData.executeMeasures = measureArr;
                    eval("$scope." + $scope.selectedChart.chartType + ".executeQuery(cat, res, query)");
                } else {
                    //alert('request failed');
                    privateFun.fireMessage('0', '<strong>Invalid query :</strong>please enter request failed ');
                    $scope.isPendingRequest = false;
                    $scope.eventHndler.isLoadingChart = false;
                }
            }, $scope.initRequestLimit.value);
        } else {
            // alert("enter a query");
            $scope.isPendingRequest = false;
            $scope.eventHndler.isLoadingChart = false;
            privateFun.fireMessage('0', 'pelase enter a query');

        }
    };

    $scope.mapResult = function (cat, res, cb) {
        var serArr = [];
        var serColor = "";

        //dynamically building the series objects
        for (c in res[0]) {
            if (Object.prototype.hasOwnProperty.call(res[0], c)) {
                if (c != cat) {
                    typeof $scope.recordedColors[c] == "undefined" ? serColor = "#EC784B" : serColor = $scope.recordedColors[c];
                    serArr.push({
                        name: c,
                        color: serColor,
                        data: [],
                        origName: c
                    });
                }
            }
        }

        //fill the series array
        res.forEach(function (key) {
            serArr.forEach(function (ser) {
                ser.data.push({
                    name: key[cat],
                    y: parseFloat(key[ser.name])
                });
            });
        });
        cb(serArr);
    };

    $scope.removeMeasure = function (m) {
        var arrObj = $scope.executeQryData.executeMeasures;
        var index = arrObj.indexOf(m);
        if (index > -1) {
            arrObj.splice(index, 1);
            eval("$scope." + $scope.selectedChart.chartType + ".removeMea(arrObj.length)");
        }
    };

    $scope.removeCategory = function (c) {
        var arrObj = $scope.executeQryData.executeColumns;
        var index = arrObj.indexOf(c);
        if (index > -1) {
            arrObj.splice(index, 1);
            eval("$scope." + $scope.selectedChart.chartType + ".removeCat()");
        }
    };


    var queryBuilderData = {
        select: []
    };
    $scope.queryBuilderData = queryBuilderData;

    $scope.dragabbleEvent = {
        onDropCompleteMeasure: function (dragData, dropFiled) {
            console.log("onDropCompleteMeasure:" + JSON.stringify(dragData) + " " + JSON.stringify(dropFiled));
            $scope.eventHndler.onClickCondition(dragData, dropFiled);

        },
        onDropCompleteGroup: function (dragData) {
            $scope.eventHndler.onClickColumn(dragData);
        }
    }

    //on click edit customer query
    $scope.changeEditState = function () {
        $scope.queryEditState = !$scope.queryEditState;
        $scope.isPendingRequest = $scope.queryEditState;
    };

    //drilling down from here...
    $scope.toggleDrilled = function (state) {
        $scope.isDrilled = state;
        if (!state && $scope.executeQryData.executeColumns.length == 2) {
            $scope.executeQryData.executeColumns.pop();
            $scope.getGroupedAggregation($scope.executeQryData.executeColumns[0].filedName);
        }
    };

    //metric decimal change
    $scope.changeDecimals = function () {
        $scope.selectedChart.initObj.value = convertDecimals($scope.selectedChart.initObj.decValue, parseInt($scope.selectedChart.initObj.dec));
    };

    $scope.recordColor = function (ser) {
        $scope.recordedColors[ser.name] = ser.color;
    };

    //#damith
    //create custom query design catch syntax error

}).directive("markable", function () {
    return {
        link: function (scope, elem, attrs) {
            elem.on("click", function () {
                elem.addClass("active-condition");
            });
        }
    };
}).directive("removeMarkable", function () {
    return {
        link: function (scope, elem, attrs) {
            elem.on("click", function () {
                elem.addClass("de-active-condition");
            });
        }
    };
}).directive("selectedSettingIcon", function () {
    return {
        link: function (scope, elem, attrs) {
            elem.on("click", function () {
                elem.addClass("icon-select-ri1");
            });
        }
    };
}).directive("findSelectTab", function () {
    return {
        link: function (scope, elem, attrs) {
            elem.on("click", function () {
                elem.addClass("icon-select-ri1");
            });
        }
    };
});
