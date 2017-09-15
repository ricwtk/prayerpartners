var DEBUG = true;

function showDebug(debugString) {
  if (DEBUG) {
    try {
      console.log(...debugString);
    } catch (e) {
      console.log(debugString);
    }
  }
}

function copyObj(object) {
  return JSON.parse(JSON.stringify(object));
}

function getContent(filename) {
  let req = new Request("./guide/" + filename);
  return fetch(req).then(res => {
    if (res.ok) {
      let contentType = res.headers.get("Content-Type");
      if (contentType.includes("json")) {
        return res.json();
      } else {
        return res.text();
      }
    } else {
      throw new Error(res.text());
    }
  });
}

function formatItemQuery(file) {
  return "f=" + file; // + "#" + location;
}

function hashAnchor(name) {
  let anchor = "";
  name.toLowerCase().replace(/[a-z]/g, (match, p1) => {
    anchor += match;
  });

  return anchor;
}

Vue.component("menu-item", {
  props: ["item", "level", "file"],
  data: () => {
    return {
      showChildren: true
    }
  },
  computed: {
    thisClass: function () {
      return {
        levellight: this.level % 2 == 0,
        leveldark: !(this.level % 2 == 0),
      }
    }
  },
  methods: {
    toggleSubAndGoTo: function () {
      // this.showChildren = !this.showChildren;
      // if (window.location.search.replace("?", "") != formatItemQuery(this.file, this.location)) {
      window.location.href = window.location.pathname + "?" + formatItemQuery(this.file) + "#" + hashAnchor(this.item.name);
      // window.location.hash = hashAnchor(this.item.name);
      // window.location.search = formatItemQuery(this.file);

      // }
    }
  },
  mounted: function () {
    showDebug(copyObj(this.item));
  },
  template: `
    <div :class="thisClass">
      <div class="item-head-row" @click="toggleSubAndGoTo">
        <template v-for="n in (level-1)"><span class="indent"></span></template>
        <template v-if="item.children && item.children.length > 0">
          <span v-if="showChildren">&#x25be;</span>
          <span v-else>&#x25b8;</span>
        </template>
        <span class="indent"></span>
        <span class="item-head">{{ item.name }}</span>
      </div>
      <div v-show="showChildren" v-if="item.children && item.children.length > 0">
        <template v-for="it in item.children">
          <menu-item :item="it" :level="level+1" :file="it.file ? it.file : item.file"></menu-item>
        </template></div>
    </div>
  `
})

var converter = new showdown.Converter({
  tables: true,
  customizedHeaderId: true
});

var globalStore = new Vue({
  data: {
    showMenu: window.screen.width > 800 ? true : false
  }
});

var main = new Vue({
  el: "#main",
  data: {
    menu: [],
    testMdRaw: ""
  },
  computed: {
    showMenu: () => globalStore.showMenu,
    testMd: function () {
      // return marked(this.testMdRaw)
      return converter.makeHtml(this.testMdRaw);
    }
  },
  created: function () {
    getContent("menu.json").then(res => {
      this.menu = res;
    })
  }
})

var header = new Vue({
  el: "#header",
  methods: {
    toggleMenu: function () {
      globalStore.showMenu = !globalStore.showMenu;
    }
  }
})

query = new URLSearchParams(window.location.search);
showDebug([query.get("f"), query.get("l")]);

var fileToGet = "initialisation.md"
if (query.get("f")) {
  fileToGet = query.get("f") + ".md";
}
getContent(fileToGet).then(res => {
  // showDebug([res]);
  main.testMdRaw = res;
}, err => {
  getContent("nopage.md").then(res => {
    // showDebug([res]);
    main.testMdRaw = res;
  });
});