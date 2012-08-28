/**
 * Offline Support for Cloud9
 *
 * @copyright 2010, Ajax.org B.V.
 */
define(function(require, exports, module) {

var ide     = require("core/ide");
var ext     = require("core/ext");
var Offline = require("ext/offline/lib-offline");
var markup  = require("text!ext/offline/skin.xml");

module.exports = ext.register("ext/offline/offline", {
    dev      : "Ajax.org",
    name     : "Offline",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,

    offlineStartup : 0,

    /**
     * Test method for going offline/online
     * @param {Boolean} online If the request is to go online or not
     */
    test : function(online){
        ide.testOffline = online ? 2 : 1;
        if (online)
            ide.socket.socket.connect();
        else
            ide.socket.socket.disconnect();
    },

    /**
     * Init method to create the offline logic
     */
    init : function(){
        var _self   = this;
        var offline = this.offline = new Offline("cloud9", (window.location.pathname + "/$reconnect").replace(/\/\//g, "/"));

        // preload the offline images programmatically:
        var img = new Image();
        img.src = ide.staticPrefix + "/ext/main/style/images/offline.png";

        if (ide.local) {
            img = new Image();
            img.src = ide.staticPrefix + "/ext/main/style/images/local_green.png";
        }

        //Forward Events
        offline.dispatchEvent = function(name, e){
            ide.dispatchEvent(name, e);
        };

        ide.onLine = -1;

        ide.addEventListener("afteroffline", function(){
            stServerConnected.deactivate();
            ide.onLine = false;
            apf.setStyleClass(logobar.$ext, "offline");

            if (ide.local)
                offlineNotifyDialog.show();
			
            _self.bringExtensionsOffline();
        });

        // make sure that ide.onLine is actual 1 here already
        // because otherwise you'll run into timing issues, because some
        // extensions do an additional check for ide.onLine !== 0 as well (like jsdav)
        //
        // if that extension handles the event faster than offline, you'll run into problemo's
        ide.addEventListener("beforeonline", function () {
            stServerConnected.activate();
            ide.onLine = true;
        });

        ide.addEventListener("afteronline", function(e){
            apf.setStyleClass(logobar.$ext, "", ["offline"]);
            _self.bringExtensionsOnline();
            if (ide.local)
                offlineNotifyDialog.hide();

        });

        ide.addEventListener("localOffline", function(e) {
            apf.setStyleClass(logobar.$ext, "offline local");
        });

        ide.addEventListener("localOnline", function(e) {
            apf.setStyleClass(logobar.$ext, "", ["offline"]);
        });

        ide.addEventListener("socketConnect", function() {
             offline.goOnline();
        });

        ide.addEventListener("socketDisconnect", function(){
            offline.goOffline();
        });

        if (this.offlineStartup)
            ide.dispatchEvent("afteroffline"); // Faking offline startup
        
        // We may miss the first socketConnect event
        if (ide.socket.socket.connected)
            offline.goOnline();
        else
            offline.goOffline();
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
        //Remove all events
    },

    bringExtensionsOnline : function(){
        var exts = ext.extensions;
        for (var i = 0, l = exts.length; i < l; i++) {
            var _ext = exts[i];
            if (_ext.offline === false)
                _ext.enable();
        }
    },

    bringExtensionsOffline : function(){
        var exts = ext.extensions;
        for (var i = 0, l = exts.length; i < l; i++) {
            var _ext = exts[i];
            if (_ext.offline === false)
                _ext.disable();
        }
    },

    toggleInfoDiv : function(show) {
        if (show == true)
            offlineInfoDiv.style.display = "block";
        else
            offlineInfoDiv.style.display = "none";
    }
});

});
