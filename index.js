//
// Logo Interpreter in Javascript
//

// Copyright (C) 2011 Joshua Bell
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var g_logo;

var g_history = [];
var g_historypos = -1;

var g_entry;

function loadCommandBox() {
  g_entry = document.getElementById('entry_multi');
}


function onenter() {
  var e = g_entry;
  var v = g_entry.value;
  if (v !== '') {
    try {
      g_logo.run(v);
    } catch (e) {
      window.alert("Error: " + e.message);
    }
  }
}

var KEY = {
  RETURN: 10, // iOS
  ENTER: 13,
  END: 35,
  HOME: 36,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40
};

function onkey(e) {
  e = e ? e : window.event;

  var consume = false;

  // switch (e.keyCode) {
  //   case KEY.RETURN:
  //   case KEY.ENTER:
  //     onenter();
  //     consume = true;
  //     break;

  //   case KEY.UP:
  //     if (g_history.length > 0) {
  //       if (g_historypos === -1) {
  //         g_historypos = g_history.length - 1;
  //       } else {
  //         g_historypos = (g_historypos === 0) ? g_history.length - 1 : g_historypos - 1;
  //       }
  //       document.getElementById('entry_single').value = g_history[g_historypos];
  //     }
  //     consume = true;
  //     break;

  //   case KEY.DOWN:
  //     if (g_history.length > 0) {
  //       if (g_historypos === -1) {
  //         g_historypos = 0;
  //       } else {
  //         g_historypos = (g_historypos === g_history.length - 1) ? 0 : g_historypos + 1;
  //       }
  //       document.getElementById('entry_single').value = g_history[g_historypos];
  //     }
  //     consume = true;
  //     break;
  // }

  // if (consume) {
  //   e.cancelBubble = true; // IE
  //   e.returnValue = false;
  //   if (e.stopPropagation) { e.stopPropagation(); } // W3C
  //   if (e.preventDefault) { e.preventDefault(); } // e.g. to block arrows from scrolling the page
  //   return false;
  // } else {
  //   return true;
  // }
}

var savehook;
function initStorage(loadhook) {
  if (!indexedDB)
    return;

  var req = indexedDB.open('logo', 2);
  req.onupgradeneeded = function() {
    var db = req.result;
    db.createObjectStore('procedures');
  };
  req.onsuccess = function() {
    var db = req.result;

    var tx = db.transaction('procedures');
    var curReq = tx.objectStore('procedures').openCursor();
    curReq.onsuccess = function() {
      var cursor = curReq.result;
      if (cursor) {
        try { loadhook(cursor.value); } catch (e) { console.log("error loading procedure: " + e); }
        cursor.continue();
      } else {
        savehook = function(name, def) {
          var tx = db.transaction('procedures', 'readwrite');
          tx.objectStore('procedures').put(def, name);
        };
      }
    };
  };
}

window.onload = function() {

  var stream = {
    read: function(s) {
      return window.prompt(s ? s : "");
    },
    write: function() {
      var div = document.getElementById('overlay');
      for (var i = 0; i < arguments.length; i += 1) {
        div.innerHTML += arguments[i];
      }
      div.scrollTop = div.scrollHeight;
    },
    clear: function() {
      var div = document.getElementById('overlay');
      div.innerHTML = "";
    },
    readback: function() {
      var div = document.getElementById('overlay');
      return div.innerHTML;
    }
  };

  var canvas_element = document.getElementById("sandbox"), canvas_ctx = canvas_element.getContext('2d'),
      turtle_element = document.getElementById("turtle"), turtle_ctx = turtle_element.getContext('2d');
  var turtle = new CanvasTurtle(
    canvas_ctx,
    turtle_ctx,
    canvas_element.width, canvas_element.height);

  g_logo = new LogoInterpreter(
    turtle, stream,
    function (name, def) {
      if (savehook) {
        savehook(name, def);
      }
      // g_logo.run(def);
    });
  // initStorage(function (def) {
    g_logo.run('');
  // });

  loadCommandBox();

  document.getElementById('run').onclick = onenter;

  g_entry = document.getElementById('entry_multi');
  g_entry.onkeydown = onkey;
  g_entry.focus();  

  function demo(param) {
    param = String(param);
    if (param.length > 0) {
      param = decodeURIComponent(param.substring(1).replace(/\_/g, ' '));
      g_entry.value = param;
      try {
        g_logo.run(param);
      } catch (e) {
        window.alert("Error: " + e.message);
      }
    }
  }

  // Look for a program to run in the query string / hash
  var param = document.location.search || document.location.hash;
  demo(param);
  window.onhashchange = function(e) { demo(document.location.hash); };
};
