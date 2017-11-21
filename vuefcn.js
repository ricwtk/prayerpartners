var globalStore = new Vue({
  data: {
    fblogin: false,
    googlelogin: false,
    showMenu: false,
    savedData: newUserData(),
    showLoading: true,
    showAbout: false,
    initToast: false,
    toastMessage: "",
    showToast: false,
    toastTimeoutFn: null,
    idpData: {
      idp: null,
      userId: null,
      name: null,
      email: null,
      profilePicture: null,
      profileLink: null
    },
    friendRequestsDisplay: [],
    connectedFriendsDetails: []
  },
  computed: {
    showSignIn: function () {
      return !(this.fblogin || this.googlelogin);
    },
    friendRequests: function () {
      return this.savedData.friendRequests ? this.savedData.friendRequests : [];
    },
    connectedFriends: function () {
      return this.savedData.friends
        .filter(fr => fr.userId.startsWith("g") || fr.userId.startsWith("fb"))
        .map(fr => fr.userId);
    }
  },
  watch: {
    initToast: function () {
      if (this.initToast) {
        this.initToast = false;
        if (DEBUG) console.log("toast-notification", this.toastMessage);
        this.showToast = true;
        if (this.toastTimeoutFn !== null) {
          clearTimeout(this.toastTimeoutFn);
        }
        this.toastTimeoutFn = setTimeout(() => {
          this.showToast = false;
        }, 2000);
      }
    },
    friendRequests: function () {
      if (globalStore.savedData.friendRequests.length > 0) {
        getUsers(globalStore.savedData.friendRequests.map(frreq => frreq.userId), function (err, data) {
          globalStore.friendRequestsDisplay = data.Responses[USERDATATABLE];
        });
      } else {
        globalStore.friendRequestsDisplay = [];
      }
    },
    connectedFriends: function () {
      if (this.connectedFriends.length > 0){
        getUsers(this.connectedFriends, (err, data) => {
          this.connectedFriendsDetails = data.Responses[USERDATATABLE];
        });
      }
    }
  }
});

Vue.component('toast-notification', {
  computed: {
    toastMessage: () => globalStore.toastMessage,
  },
  template: `
    <div class="toast decor-toast">
      <div class="toast-content decor-toast-content" v-html="toastMessage">
      </div>
    </div>
  `
});

Vue.component('loading-overlay', {
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-content">
        <div class="loading-icon"><i class="fa fa-ellipsis-h"></i></div>
      </div>
    </div>
  `
});

Vue.component('about-overlay', {
  methods: {
    closeThis: function () {
      this.$emit('close');
    }
  },
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-content" id="about-content">
        <div id="about-appname">Prayer Partners</div>
        <div class="sep"></div><div class="sep"></div>
        <div>Developer: Richard Wong <a href="mailto:ricwtk@gmail.com" target="_blank">ricwtk@gmail.com</a></div>
        <div>Use <a href="https://github.com/ricwtk/prayerpartners/issues"  target="_blank">Github issue tracker <i class="fa fa-link"></i></a> or email me to report any issue or suggest any enhancement</div>
        <div>
          <a href="https://github.com/ricwtk/prayerpartners"  target="_blank">Source code on Github <i class="fa fa-link"></i></a>
          <a href="./privacypolicy.html" target="_blank">Privacy policy <i class="fa fa-link"></i></a>
          <a href="./permissionsexplained.html" target="_blank">Permissions explained <i class="fa fa-link"></i></a>
        </div>
        <div class="sep"></div>
        <div>
          This project is developed with 
          <a href="https://vuejs.org/" target="_blank">vue.js</a>, 
          <a href="https://github.com/dankogai/js-base64" target="_blank">base64.js</a>, 
          <a href="" target="_blank">MimeMessage.js</a>, 
          <a href="https://github.com/showdownjs/showdown" target="_blank">Showdown.js</a>,
          <a href="http://fontawesome.io/" target="_blank">FontAwesome</a>
        </div>
        <button type="button" @click="closeThis">Close</button>
      </div>
    </div>
  `
});

Vue.component("edit-name-overlay", {
  props: ["name"],
  data: function () {
    return {
      newName: ''
    };
  },
  created: function () {
    this.newName = this.name;
  },
  methods: {
    saveThis: function () {
      this.$emit("save", this.newName);
      this.closeThis();
    },
    closeThis: function () {
      this.$emit("close");
    }
  },
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-wrapper">
        <div class="overlay-row">
          <div class="overlay-label">Change display name from "{{ name }}" to &nbsp;</div>
          <input class="overlay-input" type="text" v-model="newName">
        </div>
        <div class="overlay-actions">
          <button type="button" @click="saveThis"><i class="fa fa-save"></i> Save</button>
          <button type="button" @click="closeThis"><i class="fa fa-undo"></i> Cancel</button>
        </div>
      </div>
    </div>
  `
});

Vue.component("edit-profile-overlay", {
  data: function () {
    return {
      newUserName: ''
    };
  },
  computed: {
    userName: function () {
      return globalStore.savedData.name;
    },
    profilePic: () => {
      return globalStore.savedData.profilePicture;
    },
    idpClass: () => {
      return {
        fa: true,
        "fa-google-plus-official": globalStore.savedData.idp == "google",
        "fa-facebook-official": globalStore.savedData.idp == "facebook"
      };
    },
    userName: () => {
      return globalStore.savedData.name;
    },
    userEmail: () => {
      return globalStore.savedData.email;
    }
  },
  created: function () {
    this.newUserName = globalStore.savedData.name;
  },
  methods: {
    goToProfile: function () {
      if (globalStore.savedData.profileLink !== null) {
        window.open(globalStore.savedData.profileLink, "_blank");
      }
    },
    signOut: function () {
      logout();
      this.$emit("close");
    },
    closeThis: function () {
      this.$emit("close");
    }
  },
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-wrapper">
        <div class="overlay-row" id="signed-in-display">
          <div id="signed-in-box">
            <b>Signed in as</b>
            <div id="signed-in-data">
              <img :src="profilePic" id="signed-in-display-pic">
              <div class="horizontal-sep"></div>
              <div id="signed-in-text">
                <div id="signed-in-idp-display">
                  <i :class="idpClass" id="signed-in-idp" @click="goToProfile"></i>
                  <div class="horizontal-sep"></div>
                  {{ userName }}
                </div>
                <div class="sep"></div>
                <div>{{ userEmail }}</div>
              </div>
            </div>
            <div class="sep"></div>
            <div class="overlay-row account-actions"><button type="button" @click="signOut">Sign out</button></div>
            <div class="sep"></div>
            <div class="overlay-row account-actions"><button type="button" @click="closeThis">Close</button></div>
          </div>
        </div>
      </div>
    </div>
  `
});

Vue.component("unsigned-in-overlay", {
  methods: {
    signInG: () => {
      googlelogin();
    },
    signInFb: () => {
      fblogin();
    },
    goToGuide: () => {
      window.open("./guide.html", "_blank");
    },
    goToPermissions: () => {
      window.open("./permissionsexplained.html", "_blank");
    },
  },
  template: `
    <div id="signin-overlay" class="overlay decor-overlay">
      <div class="overlay-row">
      Sign in with 
      <div class="horizontal-sep"></div>
      <i class="fa fa-google-plus-official signin-button" id="signin-google" title="Google" @click="signInG"></i>
      <i class="horizontal-sep"></i>
      <i class="fa fa-facebook-official signin-button" id="signin-facebook" title="Facebook" @click="signInFb"></i>
      </div>
      <div class="sep"></div>
      <div class="overlay-row">
        <a href="./guide.html" target="_blank">Guide</a>
        <!--<div class="horizontal-sep"></div>
        <a href="./permissionsexplained.html" target="_blank">Permissions explained</a>-->
      </div>
    </div>
  `
});



var app = new Vue({
  el: '#main',
  data: {
    showList: 'single',
  },
  computed: {
    myItems: function () {
      var myitems = globalStore.savedData.items.filter(item => !item.archived);
      myitems.sort(function (a, b) {
        return a.order - b.order;
      })
      return myitems;
    },
    myArchived: function () {
      return globalStore.savedData.items.filter(item => item.archived);
    },
    mySharedWithList: function () {
      var shareableFriends = globalStore.savedData.friends.filter(friend => !friend.userId.startsWith("pri"));
      var allFriends = shareableFriends.map(friend => {
        return {
          name: friend.name,
          userId: friend.userId,
          items: globalStore.savedData.items.filter(item => (item.sharedWith.includes(friend.userId)))
        };
      });
      if (DEBUG) console.log("allFriends", allFriends);
      return allFriends;
    },
    myFriendList: function () {
      var allFriends = globalStore.savedData.friends.map(friend => friend);
      allFriends.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      })
      return allFriends;
    },
    myUnshared: function () {
      return globalStore.savedData.items.filter(item => (item.sharedWith.length == 0));
    },
    myTags: function () {
      var tags = [];
      globalStore.savedData.items.forEach(item => {
        tags = tags.concat(item.tags.filter(tag => tags.indexOf(tag) < 0));
      });
      var allTags = tags.map(tag => {
        return {
          name: tag,
          items: globalStore.savedData.items.filter(item => (item.tags.includes(tag)))
        };
      });
      if (DEBUG) console.log("allTags", copyObj(allTags));
      return allTags;
    },
    myUntagged: function () {
      return globalStore.savedData.items.filter(item => (item.tags.length == 0));
    }
  },
  methods: {
    removeFriend: function (friendId) {
      var indexOfFriend = globalStore.savedData.friends.findIndex((friend) => friend.friendId == friendId);
      if (DEBUG) console.log("remove '" + globalStore.savedData.friends[indexOfFriend].name + "' (id: " + globalStore.savedData.friends[indexOfFriend].friendId + ")");
      globalStore.savedData.friends.splice(indexOfFriend, 1);
      updateToDatabase();
    },
  },
});

var app_head = new Vue({
  el: '#sitehead',
  data: {},
  computed: {
    showMenu: () => {
      return globalStore.showMenu;
    }
  },
  methods: {
    toggleMenu: function () {
      globalStore.showMenu = !globalStore.showMenu;
    }
  },
});

var app_global = new Vue({
  el: '#global',
  computed: {
    showLoading: () => globalStore.showLoading,
    showToast: () => globalStore.showToast
  }
});

var app_overlay = new Vue({
  el: '#overlay-holder',
  computed: {
    showAbout: () => globalStore.showAbout,
    showSignIn: () => globalStore.showSignIn,
    saveProfile: (newProfileName) => {
      globalStore.savedData.name = newProfileName;
      updateToDatabase();
    }
  },
  methods: {
    closeAbout: () => {
      globalStore.showAbout = false;
    }
  }
});