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
    let contentType = res.headers.get("Content-Type");
    if (contentType.includes("json")) {
      return res.json();
    } else {
      return res.text();
    }
  });
}

function formatItemQuery(file, location) {
  return "f=" + file + "&l=" + location;
}

Vue.component("menu-item", {
  props: ["item", "level", "file", "location"],
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
      window.location.search = formatItemQuery(this.file, this.location);
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
          <menu-item :item="it" :level="level+1" :file="it.file ? it.file : item.file" :location="it.location ? it.location : item.location"></menu-item>
        </template>
      </div>
    </div>
  `
})


var globalStore = new Vue({
  data: {
    showMenu: window.screen.width > 800 ? true : false
  }
});

new Vue({
  el: "#main",
  data: {
    menu: [],
    testMd: marked("# abc", {
      sanitize: true
    })
  },
  computed: {
    showMenu: () => globalStore.showMenu
  },
  created: function () {
    getContent("menu.json").then(res => {
      this.menu = res;
    })
  }
})

new Vue({
  el: "#header",
  methods: {
    toggleMenu: function () {
      globalStore.showMenu = !globalStore.showMenu;
    }
  }
})

query = new URLSearchParams(window.location.search);
showDebug([query.get("f"), query.get("l")]);