'use strict';
var piAPIClient= (function(){

  	function piAPI(iframe){
        var idoc = iframe.contentDocument || iframe.contentWindow.document;
      	console.log(idoc);
        var ip = idoc.getElementById( 'pi-ip' ).innerHTML;
      	console.log(ip);
        var eventQueue = idoc.getElementById( 'pi-events' );

        function pingPIViaWebsocket( callback ) {
            var callbackSent = false;

            if ( ip && isValidIpv4Addr( ip ) ) {
                window.WebSocket = window.WebSocket || window.MozWebSocket;
                var connection = new WebSocket( 'ws://' + ip + ':1337' );
                var timer = setTimeout( function () {
                    if ( !callbackSent ) {
                        callback( "failed" );
                        callbackSent = true;
                        connection.close();
                    }
                }, 5000 );

                connection.onerror = function ( error ) {
                    if ( !callbackSent ) {
                        callback( "failed" );
                        callbackSent = true;
                        connection.close();
                    }
                };

                connection.onopen = function () {
                    clearInterval( timer );
                    if ( !callbackSent ) {
                        callback( "success" );
                        callbackSent = true;
                        connection.close();
                    }
                };
            } else {
              	callback("failed");
            }
        }

        function pingPIViaWebstrate( callback ) {
            var timer;
            var eventId = guid();
            var observer = new MutationObserver( function ( mutations ) {
                mutations.forEach( function ( m ) {
                    if ( m.type === 'childList' && m.addedNodes.length > 0 && m.addedNodes[ 0 ].tagName === 'PONG' && m.addedNodes[ 0 ].id === eventId ) {
                        callback( "success" );
                        clearInterval( timer );
                        var el = idoc.getElementById( eventId );
                        el.parentNode.removeChild( el );
                    }
                } );
            } );
            var config = {
                attributes: false,
                childList: true,
                characterData: true
            };

            observer.observe( eventQueue, config );
            timer = setTimeout( function () {
                observer.disconnect();
                var el = idoc.getElementById( eventId );
                el.parentNode.removeChild( el );

                callback( "failed" );
            }, 5000 );
            eventQueue.innerHTML += '<ping id="' + eventId + '"></ping>';
        }

        /*
        * Function for generating unique event ids
        */
        function guid() {
            function s4() {
                return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }

        function isValidIpv4Addr( ip ) {
            return /^(?=\d+\.\d+\.\d+\.\d+$)(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.?){4}$/.test( ip );
        }

        return Object.freeze( {
            pingPIViaWebsocket,
            pingPIViaWebstrate
        } );
  	}

    return piAPI;

}());