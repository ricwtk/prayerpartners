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

Vue.component("friend-request", {
  props: ["user"],
  data: function () {
    return {}
  },
  computed: {
    idpDisplay: function () {
      return {
        fa: true,
        'fa-google-plus-official': this.user.userId.startsWith("g"),
        'fa-facebook-official': this.user.userId.startsWith("fb")
      }
    }
  },
  methods: {
    linkProfile: function () {
      window.open(this.user.profileLink, "_blank");
    },
    acceptRequest: function () {
      if (DEBUG) console.log("acceptRequest");
      // send notification to accept
      sendAccept(this.user.userId);
      // check if friend is already in friend list
      if (!globalStore.savedData.friends.map(fri => fri.userId).includes(this.user.userId)) {
        // add friend to my friend list
        globalStore.savedData.friends.push(newFriend(this.user.userId, this.user.name));
      }
      // remove request from my friendrequests list
      this.removeRequest();
      updateToDatabase();
    },
    rejectRequest: function () {
      if (DEBUG) console.log("rejectRequest");
      this.removeRequest();
      updateToDatabase();
    },
    removeRequest: function () {
      if (DEBUG) console.log("removeRequest");
      // remove request from my friendrequests list
      let indexOfRequest = globalStore.savedData.friendRequests.findIndex(friend => friend.userId == this.user.userId);
      globalStore.savedData.friendRequests.splice(indexOfRequest, 1);
    }
  },
  template: `
    <span class="menu-item friend-invite">
      <div class="friend-invite-identity">
        <div class="friend-invite-pic">
          <img :src="user.profilePicture" :alt="user.name" class="friend-invite-profile-picture">
        </div>
        <div class="horizontal-sep"></div>
        <div class="friend-invite-text">
          <div class="friend-invite-name"><i :class="idpDisplay"></i> {{ user.name }}</div>
          <div class="friend-invite-email">{{ user.email }}</div>
        </div>
      </div>
      <div class="friend-invite-actions">
        <div class="friend-invite-link decor-menuitem" @click="linkProfile"><i class="fa fa-external-link"></i></div>
        <div class="friend-invite-accept decor-menuitem" @click="acceptRequest"><i class="fa fa-plus"></i></div>
        <div class="friend-invite-reject decor-menuitem" @click="rejectRequest"><i class="fa fa-times"></i></div>
      </div>
    </span>
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
    openEditProfile: () => {
      globalStore.showEditProfile = true;
    },
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
      <span class="menu-item-flex-row decor-menuitem" id="signed-in-as" :title="userEmail" @click="openEditProfile">Signed in as 
        <div id="menu-profile-picture-container">
          <img :src="profilePic" :alt="userName" id="menu-profile-picture">
          <div id="menu-profile-picture-overlay" :class="idpDisplay"></div>
        </div>
      </span>
      <span class="menu-item-flex-row decor-menuitem">
        <user-details-actions :user="globalStore.savedData" actions="al"></user-details-actions>
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
      <template v-for="friendRequest in friendRequests">
        <friend-request 
          :user="friendRequest">
        </friend-request>
      </template>
    </div>  
  `
});