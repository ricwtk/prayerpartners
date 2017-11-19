Vue.component("site-head", {
  methods: {
    toggleMenu: function () {
      this.$emit("toggle");
    }
  },
  template: `
    <div id="header" class="decor-header">
      <span id="pagetitle">Prayer Partners</span>
      <span id="menutoggle" 
        class="decor-menuitem"
        @click="toggleMenu"><i class="fa fa-bars"></i></span>
    </div>
  `
});

Vue.component("site-menu", {
  data: function () {
    return {
      showEditProfile: false,
      showAbout: false,
      widthOfSection: Number(globalStore.savedData.ui.sectionStyle.width.replace("px", "")),
      heightOfSection: Number(globalStore.savedData.ui.sectionStyle.height.replace("px", ""))
    }
  },
  computed: {
    widthOfSectionWithUnit: function () {
      return this.widthOfSection.toString() + "px";
    },
    heightOfSectionWithUnit: function () {
      return this.heightOfSection.toString() + "px";
    },
    userName: () => {
      return globalStore.idpData.name;
      // return globalStore.savedData.name;
    },
    userEmail: () => {
      return globalStore.idpData.email;
      // return globalStore.savedData.email;
    },
    profilePic: () => {
      return globalStore.idpData.profilePicture;
    },
    friendRequests: () => {
      return globalStore.friendRequestsDisplay;
    },
    idpDisplay: () => {
      return {
        fa: true,
        'fa-google-plus-official': globalStore.savedData.idp == "google",
        'fa-facebook-official': globalStore.savedData.idp == "facebook"
      }
    }
  },
  watch: {
    "widthOfSection": function () {
      globalStore.savedData.ui.sectionStyle.width = this.widthOfSectionWithUnit;
    },
    "heightOfSection": function () {
      globalStore.savedData.ui.sectionStyle.height = this.heightOfSectionWithUnit;
    }
  },
  methods: {
    openAbout: () => {
      globalStore.showAbout = true;
    },
    signIn: () => {
      handleAuthClick();
    },
    goToGuide: () => {
      window.open("./guide.html", "_blank");
    },
    saveUi: () => {
      if (DEBUG) console.log("saveUi");
      updateToDatabase();
    },
  },
  template: `
    <div id="menu" class="decor-menu">
      <span class="menu-item-section">Signed in as</span>
      <span class="menu-item">
        <user-details-actions :user="globalStore.savedData" actions="lo"></user-details-actions>
      </span>
      <span class="menu-item-section">UI settings</span>
      <span class="menu-item" id="section-width">
        Width of list ({{ widthOfSectionWithUnit }})<br>
        <input id="input-section-width" type="range" min="300" max="1000" v-model="widthOfSection" @mouseup="saveUi">
      </span>
      <span class="menu-item" id="section-height">
        Height of list ({{ heightOfSectionWithUnit }})<br>
        <input id="input-section-height" type="range" min="200" max="500" v-model="heightOfSection" @mouseup="saveUi">
      </span>
      <span class="menu-item-section">Links</span>
      <span class="menu-item decor-menuitem" id="go-to-guide" @click="goToGuide">Guide</span>
      <span class="menu-item decor-menuitem" id="open-about" @click="openAbout">About Prayer Partners</span>
      <span v-if="friendRequests.length > 0" class="menu-item-section">Friend requests</span>
      <span v-for="friendRequest in friendRequests" class="menu-item">
        <user-details-actions 
          :user="friendRequest"
          actions="lcr">
        </user-details-actions>
      </span>
    </div>  
  `
});