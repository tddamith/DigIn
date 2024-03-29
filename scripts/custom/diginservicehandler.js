'use strict';
    function getHost() {
        var host = window.location.hostname;

        if (host.indexOf("localhost") != -1 || host.indexOf("127.0.0.1") != -1) host = "104.131.48.155";
        return host;
    }

    function getNamespace() {
        var authdata = JSON.parse(getCookie("authData"));
        var namespace = authdata.Email.replace(/[@.]/g, '_');
        return namespace;
    }
        function DiginEngineClient(_dsid, _db) {
            var dataSetId = _dsid;
            var database = _db;

            return {
                getTables: function (cb) {
                    $servicehelpers.httpSend("get", function (data, status, msg) {
                        cb(data, status);
                    }, $diginurls.diginengine + "/GetTables?dataSetName=" + getNamespace() + "&db=" + database);
                },

                getFields: function (tbl, cb) {
                    $servicehelpers.httpSend("get", function (data, status, msg) {
                        cb(data, status);
                    }, $diginurls.diginengine + "/GetFields?dataSetName=" + getNamespace() + "&tableName=" + tbl + "&db=" + database);
                },
                getHighestLevel: function (tbl, fieldstr, cb) {
                    if (database == "BigQuery") {
                        $servicehelpers.httpSend("get", function (data, status, msg) {
                            cb(data, status);
                        }, $diginurls.diginengine + "/gethighestlevel?tablename=[" + getNamespace() + "." + tbl + "]&id=1&levels=[" + fieldstr + "]&plvl=All&db=" + database);
                    }
                    if (database == "MSSQL") {

                        $servicehelpers.httpSend("get", function (data, status, msg) {
                            cb(data, status);
                        }, $diginurls.diginengine + "/gethighestlevel?tablename=" + tbl + "&id=1&levels=[" + fieldstr + "]&plvl=All&db=" + database);
                    }

                },
                getAggData: function (tbl, aggObjArr, cb, gb, con) {
                    var strField = "";

                    aggObjArr.forEach(function (key) {
                        strField += "[%27" + key.field + "%27,%27" + key.agg + "%27],";
                    });

                    var wSrc = "scripts/webworkers/webWorker.js";
                    if (database == "BigQuery") {
                        if (!gb) {
                            var params = "tablenames={1:%27" + getNamespace() + "." + tbl + "%27}&db=" + database + "&agg=[" + strField + "]" + "&group_by={}&cons=&order_by={}&id=" + Math.floor((Math.random() * 10) + 1);
                        } else {
                            var params = "tablenames={1:%27" + getNamespace() + "." + tbl + "%27}&db=" + database + "&agg=[" + strField + "]" + "&group_by={%27" + gb + "%27:1}&cons=&order_by={}&id=" + Math.floor((Math.random() * 10) + 1);
                        }
                    }
                    if (database == "MSSQL") {
                        if (gb === undefined) {
                            var params = "tablenames={1:%27" + tbl + "%27}&db=" + database + "&group_by={}&agg=[" + strField + "]&cons=&order_by={}";
                        } else {
                            var params = "tablenames={1:%27" + tbl + "%27}&db=" + database + "&group_by={%27" + gb + "%27:1}&&agg=[" + strField + "]&cons=&order_by={}";
                        }

                    }

                    // if (gb) params += "&group_by={'" + gb + "':1}";
                    if (con) params += "&cons=" + con;
                    var reqUrl = $diginurls.diginengine + "/aggregatefields?" + params;
                    var wData = {
                        rUrl: reqUrl,
                        method: "get"
                    };
                    $servicehelpers.sendWorker(wSrc, wData, function (data, status, msg) {
                        cb(data, status, msg);
                    });

                },

                getExecQuery: function (qStr, cb, limit) {
                    var wSrc = "scripts/webworkers/webWorker.js";
                    var limVal = 1000;
                    if (limit) limVal = limit;
                    var reqUrl = $diginurls.diginengine + "/executeQuery?query=" + qStr + "&db=" + database + "&limit=" + limVal;

                    var wData = {
                        rUrl: reqUrl,
                        method: "get"
                    };
                    $servicehelpers.sendWorker(wSrc, wData, function (data, status, msg) {
                        cb(data, status, msg);
                    });
                },

                getHierarchicalSummary: function (tbl, h, cb) {
                    $servicehelpers.httpSend("get", function (data, status, msg) {
                        cb(data, status);
                    }, $diginurls.diginengine + "/hierarchicalsummary?h=" + h + "&tablename=[" + getNamespace() + "." + tbl + "]&id=19&db=" + database);
                },
                generateboxplot: function (tbl, fieldstr, cb) {
                    $servicehelpers.httpSend("get", function (data, status, msg) {
                        cb(data, status);
                    }, $diginurls.diginengine + "/generateboxplot?q=[{'[" + getNamespace() + "." + tbl + "]':[" + fieldstr + "]}]&dbtype=" + database);
                },
                generatehist: function (tbl, fieldstr, cb) {
                    $servicehelpers.httpSend("get", function (data, status, msg) {
                        cb(data, status);
                    }, $diginurls.diginengine + "/generatehist?q=[{'[" + getNamespace() + "." + tbl + "]':[" + fieldstr + "]}]&dbtype=" + database);
                },
                generateBubble: function (tbl, x, y, c, cb) {
                    $servicehelpers.httpSend("get", function (data, status, msg) {
                        cb(data, status);
                    }, $diginurls.diginengine + "/generatebubble?&tablename=[" + getNamespace() + "." + tbl + "]&&x=" + x + "&&y=" + y + "&&c=" + c + "&&s=" + x + "&db=" + database);
                },
                        cb(data, status);
                }
            }
        }

        return {
                else return new DiginEngineClient(dsid, db);
            }
        }
    });
        return {
                if (method == "get") {
                    $http.get(reqUrl + '&SecurityToken=' + getCookie("securityToken") + '&Domain=duosoftware.com', {
                        headers: {}
                    }).
                        (data.Is_Success) ? cb(data.Result, true, data.Custom_Message) : cb(data.Custom_Message, false, "");
                    }).
                        cb(data, false, "");
                    });
                }
            },
                var w = new Worker(wSrc);
                wData.rUrl = wData.rUrl + "&SecurityToken=" + getCookie("securityToken") + "&Domain=duosoftware.com";
                w.postMessage(JSON.stringify(wData));
                        var res = JSON.parse(event.data.res);
                    }
                });
            }
        }
    });
        function RestFbClient(_page, _tst) {
            var pg = _page;
            var timestamp = _tst;
                        cb(data, status);
                    }, $diginurls.diginengine + '/pageoverview?metric_names=[%27page_views%27,%27page_fans%27,%27page_stories%27]&since=' + timestamp.sinceStamp + '&until=' + timestamp.untilStamp + '&token=' + pg.accessToken);
                },
                        cb(data, status);
                    }, $diginurls.diginengine + '/fbpostswithsummary?since=' + timestamp.sinceStamp + '&until=' + timestamp.untilStamp + '&page=' + pg.id + '&token=' + pg.accessToken);
                },
                        cb(data, status);
                },
                        cb(data, status);
                    }, $diginurls.diginengine + '/buildwordcloudFB?since=' + timestamp.sinceStamp + '&until=' + timestamp.untilStamp + '&source=facebook&token=' + pg.accessToken);
                },
                        cb(data, status);
                    }, $diginurls.diginengine + '/demographicsinfo?token=' + pg.accessToken);
                }
            }
        }
        return {
                return new RestFbClient(page, timestamp);
            }
        }
    });
        var host = getHost();
        return {
            //diginengine: "http://" + host + ":8080",
            diginengine: "http://192.168.2.33:8080",
            // diginengine: "http://192.168.2.33:8080",
            diginenginealt: "http://" + host + ":8081",
            getNamespace: function getNamespace() {
                var authdata = JSON.parse(getCookie("authData"));
                var namespace = authdata.Email.replace('@', '_');
                namespace = namespace.replace(/\./g, '_');
 
                 return namespace;
        };
    });
})(angular.module('diginServiceHandler', []))
