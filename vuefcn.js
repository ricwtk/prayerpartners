var globalStore = new Vue({
  data: {
    fblogin: false,
    googlelogin: false,
    showMenu: false,
    savedData: newUserData(),
    showLoading: true,
    showEditProfile: false,
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
    friendRequestsDisplay: []
  },
  computed: {
    showSignIn: function () {
      return !(this.fblogin || this.googlelogin);
    },
    friendRequests: function () {
      return this.savedData.friendRequests ? this.savedData.friendRequests : [];
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
    }
  }
});

Vue.component('toast-notification', {
  computed: {
    toastMessage: () => globalStore.toastMessage,
  },
  template: `
    <div class="toast decor-toast">
      <div class="toast-content decor-toast-content">
        {{ toastMessage }}
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

Vue.component('add-new-friend-section', {
  props: [],
  data: function () {
    return {
      showOverlay: false,
      newFriendEmail: '',
      newFriendName: '',
      addPrivateError: false,
      addEmailError: false,
      searchFriendString: "",
      searchFriendList: []
    }
  },
  computed: {
    sectionStyle: () => {
      return globalStore.savedData.ui.sectionStyle;
    },
    searchFriendResults: function () {
      if (DEBUG) console.log("updated friend list", copyObj(this.searchFriendList));
      let result = [];
      if (this.searchFriendList.length < 1) {
        result.push("no search string");
      } else {
        if (DEBUG) console.log("searchFriendResults", copyObj(this.searchFriendList));
        this.searchFriendList.forEach((el, idx, arr) => {
          result.push([el.searchField, el.userId].join(" "));
        })
      }
      return result.join("<br>");
    }
  },
  watch: {
    "searchFriendString": function () {
      if (this.searchFriendString == "") {
        this.searchFriendList = [];
      } else {
        searchUsers(this.searchFriendString, this, "searchFriendList");
        // this.searchFriendString.split("").reverse().join("");
      }
    },
    "showOverlay": function () {
      if (this.showOverlay) {
        let el = this.$el;
        Vue.nextTick(() => this.$el.querySelector("#search-friend-input").focus());
        window.addEventListener("keyup", this.keyupListener);
      } else {
        window.removeEventListener("keyup", this.keyupListener);
      }
    }
  },
  methods: {
    addPrivate: function () {
      let friendList = globalStore.savedData.friends.map(friend => friend.name);
      let friendId = globalStore.savedData.friends.map(friend => friend.userId);
      if (friendList.includes(this.searchFriendString)) {
        // this.addPrivateError = true;
        if (DEBUG) console.log(this.searchFriendString + " is in existing friend list");
        showToast(this.searchFriendString + " is in existing friend list");
      } else {
        addToFriend(generateId(friendId, "pri_"), this.searchFriendString);
        if (DEBUG) console.log("Save '" + this.searchFriendString + "' to friend list");
        showToast("added " + this.searchFriendString + " as friend");
        this.searchFriendString = "";
        this.showOverlay = false;
        updateToDatabase();
      }
    },
    addEmail: function () {
      let friendEmailList = globalStore.savedData.friends.map(friend => friend.email);
      let friendRequestList = globalStore.savedData.friendRequests.map(friReq => friReq.email);
      // if in friends list, notify and do not send invite
      if (friendEmailList.includes(this.newFriendEmail)) {
        this.addEmailError = true;
        if (DEBUG) console.log(this.newFriendEmail + " is in existing friend list");
        return null;
      }
      // else, if in friend requests list, send accept email, remove friend request, add to friends list
      if (friendRequestList.includes(this.newFriendEmail)) {
        sendAccept(this.newFriendEmail).then(() => {
          if (DEBUG) console.log("'" + this.newFriendEmail + "' is added to friend list");
          acceptFriendRequest(this.newFriendEmail);
          updateToDatabase();
        })
        return null;
      }
      // else, send invite email
      sendInvite(this.newFriendEmail).then(() => {
        if (DEBUG) console.log("Invite is sent to '" + this.newFriendEmail + "'");
        showToast("sent invite to " + this.newFriendEmail);
        this.newFriendEmail = '';
        this.showOverlay = false;
      }, () => {
        this.addEmailError = true;
        showToast("error adding " + this.newFriendEmail);
        if (DEBUG) console.log("Error adding " + this.newFriendEmail);
      });
    },
    keyupListener: function (e) {
      if (e.keyCode == 27) this.showOverlay = false; // escape
    }
  },
  template: `
    <div class="section decor-section section-add-new-wrapper" v-bind:style="sectionStyle">
      <div class="section-add-new item-menu decor-itemmenu" title="Add new prayer list for a friend" @click="showOverlay=true">
        <div class="section-add-new-text"><i class="fa fa-plus"></i></div>
      </div>
      <div v-if="showOverlay" class="overlay decor-overlay">
        <div class="overlay-wrapper" id="search-friend-overlay">
          <div class="sep"></div>
          <div class="overlay-row">
            <div class="overlay-label">Add friend</div>
            <div class="horizontal-sep"></div>
            <input class="overlay-input" type="text" v-model="searchFriendString" id="search-friend-input">
            <div class="horizontal-sep"></div>
            <button type="button" @click="addPrivate">Add local</button>
          </div>
          <div class="sep"></div>
          <div class="overlay-row" id="search-friend-list">
            <div v-if="searchFriendList.length < 1">
            No search string
            </div>
            <template v-else v-for="friend in searchFriendList">
              <a-friend :friendObj="friend"></a-friend>
            </template>
          </div>
          <div class="sep"></div>
          <button type="button" @click="showOverlay=false" style="width:100%"><i class="fa fa-times"></i> Close</button>
          <div class="sep"></div>
          <!--<div class="overlay-label">Add friend</div>
          <div class="overlay-row">
            <input class="overlay-input" type="text" v-model="newFriendEmail">
            <div class="horizontal-sep"></div>
            <button type="button" @click="addEmail">Invite</button>
          </div>
          <div v-if="addEmailError" class="overlay-error decor-overlayerror">Friend is already in the list. Change email.</div>
          <div class="overlay-label">Add local list for friend</div>
          <div class="overlay-row">
            <input class="overlay-input" type="text" v-model="newFriendName">
            <div class="horizontal-sep"></div>
            <button type="button" @click="addPrivate">Add</button>
          </div>
          <div v-if="addPrivateError" class="overlay-error decor-overlayerror">Friend's name exists. Change name.</div>
          <div class="overlay-actions">
            <button type="button" @click="showOverlay=false"><i class="fa fa-times"></i> Close</button>
          </div>-->
        </div>
      </div>
    </div>
  `
});

Vue.component('a-friend', {
  props: ["friendObj"],
  data: function () {
    return {
      nameLimit: 12
    }
  },
  computed: {
    idpClass: function () {
      return {
        fa: true,
        "fa-google-plus-official": this.friendObj.userId.startsWith("g"),
        "fa-facebook-official": this.friendObj.userId.startsWith("fb")
      };
    }
  },
  methods: {
    limitString: function (string) {
      if (string.length <= this.nameLimit) {
        return string;
      } else {
        return string.substring(0, this.nameLimit) + "...";
      }
    },
    onresize: function () {
      let el = this.$el.lastChild;
      let fsize = parseFloat(window.getComputedStyle(el, null).getPropertyValue('font-size'));
      this.nameLimit = el.clientWidth / (fsize * .75);
    },
    addUser: function () {
      sendRequest(this.friendObj.userId);
      showToast("Sent friend request to " + this.friendObj.name);
    }
  },
  mounted: function () {
    window.addEventListener("resize", this.onresize);
    this.onresize();
  },
  template: `
    <div class="fr-wrapper">
      <div class="fr-image"><img :src="friendObj.profilePicture"></img></div>
      <div class="horizontal-sep"></div>
      <div class="fr-label">
        <div class="fr-name" :title="friendObj.name">
          <span :class="idpClass"></span>
          {{ limitString(friendObj.name) }}
        </div>
        <div class="fr-email" :title="friendObj.email">
          {{ limitString(friendObj.email) }}
        </div>
        <div class="sep"></div>
        <div class="fr-actions">
          <button type="button" @click="addUser"><i class="fa fa-plus"></i> Add</button>
        </div>
      </div>
    </div>
  `
})

Vue.component('edit-item-overlay', {
  props: ["item", "action", "sectionType"], // action = [new, edit]
  data: function () {
    return {
      newItem: null,
      newItemTitle: "",
      newItemDesc: "",
      edited: false
    }
  },
  created: function () {
    if (this.action == "new") {
      if (this.sectionType == "mine") {
        this.newItem = newMineItem();
      } else { // if (this.sectionType == "friend")
        this.newItem = newFriendItem();
      }
      this.newItem = Object.assign({}, this.newItem, {
        edit: false,
        deleted: false
      });
    } else {
      this.newItemTitle = this.item.item;
      this.newItemDesc = this.item.desc;
    }
  },
  methods: {
    saveThis: function () {
      if (this.action == "new") {
        this.newItem.item = this.newItemTitle;
        this.newItem.desc = this.newItemDesc;
        this.newItem.edit = true;
        this.$emit('createNew', this.newItem);
      } else {
        this.item.item = this.newItemTitle;
        this.item.desc = this.newItemDesc;
        this.item.edit = true;
      }
      this.closeThis();
      if (DEBUG) console.log(copyObj(globalStore.savedData));
    },
    closeThis: function () {
      this.$emit('close');
    }
  },
  template: `
    <div class="edit-item-overlay decor-edititemoverlay">
      <div class="edit-item-wrapper">
        <div class="edit-item-overlay-label">Prayer item:</div>
        <input class="overlay-input" type="text" v-bind:value="item.item ? item.item:''" v-model="newItemTitle">
        <div class="sep"></div>
        <div class="edit-item-overlay-label">Long description:</div>
        <textarea class="edit-item-content" rows="10" v-model="newItemDesc">{{ item.desc ? item.desc:'' }}</textarea>
        <div class="sep"></div>
        <div class="edit-item-overlay-actions">
          <button type="button" @click="saveThis"><i class="fa fa-save"></i> Save</button>
          <button type="button" @click="closeThis"><i class="fa fa-undo"></i> Cancel</button>
        </div>
      </div>
    </div>
  `
});

Vue.component('single-tag', {
  props: ["isChecked", "tag"],
  data: function () {
    return {}
  },
  methods: {
    toggleState: function () {
      this.$emit('change', {
        isChecked: !this.isChecked,
        tag: this.tag
      });
    }
  },
  template: `
    <span class="tag-item" :title="tag">
      <input type="checkbox" 
        :checked="isChecked" 
        @change="toggleState">
      <span class="tag-item-name">{{ tag }}</span>
    </span>
  `
});

Vue.component('add-tag-overlay', {
  props: ["item"],
  data: function () {
    return {
      newTags: "",
      // tagList: []
    };
  },
  computed: {
    tagList: function () {
      let tags = [];
      globalStore.savedData.items.forEach(item => {
        tags = tags.concat(item.tags.filter(tag => tags.indexOf(tag) < 0));
      });
      return tags;
    }
  },
  methods: {
    closeThis: function () {
      this.$emit('close');
    },
    updateTagList: function (detail) {
      if (detail.isChecked) {
        if (DEBUG) console.log("tag list: added '" + detail.tag + "'");
        this.item.tags.push(detail.tag);
      } else {
        if (DEBUG) console.log("tag list: removed '" + detail.tag + "'");
        var idx = this.item.tags.findIndex(x => (x == detail.tag));
        this.item.tags.splice(idx, 1);
      }
      this.item.edit = true;
      if (DEBUG) console.log(copyObj(this.item));
    },
    addNewTag: function () {
      var newTags = this.newTags.split(',');
      newTags.forEach(tag => {
        this.updateTagList({
          isChecked: true,
          tag: tag
        });
      });
    }
  },
  // created: function() {
  //   savedData.items.forEach(item => {
  //     this.tagList = this.tagList.concat(item.tags.filter(tag => this.tagList.indexOf(tag) < 0));
  //   });
  //   this.tagList = copyObj(this.tagList);
  // },
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-wrapper">
        <div class="overlay-label">Tags:</div>
        <div v-if="tagList.length == 0">
          No existing tag available. Add new tag(s) with input below by separating tags with comma (,). 
          <br>New tags will only be updated after exit edit mode.
        </div>
        <div class="tags-content">
          <template v-for="tag in tagList">
            <single-tag 
              :isChecked="item.tags.includes(tag)" 
              :tag="tag"
              @change="updateTagList">
            </single-tag>
          </template>
        </div>
        <div class="overlay-row">
          <div class="overlay-label" title="Separate multiple tags by comma (,)">New tag(s): &nbsp;</div>
          <input class="overlay-input" type="text" v-model="newTags" title="Separate multiple tags by comma (,)">
          <div class="horizontal-sep"></div>
          <div class="overlay-actions">
            <button type="button" @click="addNewTag">Add</button>
          </div>
        </div>
        <div class="sep"></div>
        <div class="overlay-actions">
          <button type="button" @click="closeThis"><i class="fa fa-times"></i> Close</button>
        </div>
      </div>
    </div>
  `
});

Vue.component('single-item', {
  props: ["item", "edit", "allowOrder", "editActions"],
  data: function () {
    return {
      showDesc: false,
      showShareWith: false,
      showEdit: false,
      showTagList: false
    }
  },
  methods: {
    toggleDesc: function () {
      this.showDesc = !this.showDesc;
    },
    moveUp: function () {
      this.$emit('moveUp', this.item.itemId);
    },
    moveDown: function () {
      this.$emit('moveDown', this.item.itemId);
    },
    setArchived: function () {
      this.$emit('setArchived', this.item.itemId);
    },
    setUnarchived: function () {
      this.$emit('setUnarchived', this.item.itemId);
    },
    deleteItem: function () {
      this.$emit('deleteItem', this.item.itemId);
    },
    removeFromList: function () {
      this.$emit('removeFromList', this.item.itemId);
    }
  },
  template: `
    <div class="item">
      <div class="item-head">
        <span class="item-short-desc" @click="toggleDesc">{{ item.item }}</span>
        <span class="item-actions">
          <template v-if="edit">
            <template v-for="action in editActions">
              <span v-if="action === 'e'" class="item-archive item-menu decor-itemmenu" title="Edit" @click="showEdit=true"><i class="fa fa-pencil"></i></span>
              <span v-else-if="action === 'u'" class="item-archive item-menu decor-itemmenu" title="Unarchive" @click="setUnarchived"><i class="fa fa-upload"></i></span>
              <span v-else-if="action === 'a'" class="item-archive item-menu decor-itemmenu" title="Archive" @click="setArchived"><i class="fa fa-download"></i></span> <!--fa-angle-double-right-->
              <span v-else-if="action === 'r'" class="item-delete item-menu decor-itemmenu" title="Remove from list" @click="removeFromList"><i class="fa fa-outdent"></i></span>
              <span v-else-if="action === 'd'" class="item-delete item-menu decor-itemmenu" title="Delete" @click="deleteItem"><i class="fa fa-times"></i></span>
              <span v-else-if="action === 's'" class="item-share item-menu decor-itemmenu" title="Share" @click="showShareWith=true"><i class="fa fa-share-alt"></i></span>
              <span v-else-if="action === 't'" class="item-share item-menu decor-itemmenu" title="Tag" @click="showTagList=true"><i class="fa fa-tags"></i></span>
            </template>
          </template>
          <template v-else-if="allowOrder">
            <span class="item-archive item-menu decor-itemmenu" title="Up" @click="moveUp"><i class="fa fa-chevron-up"></i></span>
            <span class="item-delete item-menu decor-itemmenu" title="Down" @click="moveDown"><i class="fa fa-chevron-down"></i></span>
          </template>
        </span>
      </div>
      <div v-if="showDesc" class="item-long-desc">{{ item.desc }}</div>
      <edit-item-overlay 
        v-if="showEdit" 
        action="edit"
        :item="item"
        sectionType=""
        @close="showEdit=false">
      </edit-item-overlay>
      <share-with-overlay 
        v-if="showShareWith" 
        @close="showShareWith=false"
        :item="item">
      </share-with-overlay>
      <add-tag-overlay 
        v-if="showTagList" 
        @close="showTagList=false"
        :item="item">
      </add-tag-overlay>
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
      <span class="menu-item-flex-row decor-menuitem" id="signed-in-as" :title="userEmail" @click="openEditProfile">Signed in as 
        <div id="menu-profile-picture-container">
          <img :src="profilePic" :alt="userName" id="menu-profile-picture">
          <div id="menu-profile-picture-overlay" :class="idpDisplay"></div>
        </div>
      </span>
      <span class="menu-item decor-menuitem" id="go-to-guide" @click="goToGuide">Guide</span>
      <span class="menu-item decor-menuitem" id="open-about" @click="openAbout">About Prayer Partners</span>
      <span class="menu-item" id="section-width">
        Width of list ({{ widthOfSectionWithUnit }})<br>
        <input id="input-section-width" type="range" min="300" max="1000" v-model="widthOfSection" @mouseup="saveUi">
      </span>
      <span class="menu-item" id="section-height">
        Height of list ({{ heightOfSectionWithUnit }})<br>
        <input id="input-section-height" type="range" min="200" max="500" v-model="heightOfSection" @mouseup="saveUi">
      </span>
      <template v-for="friendRequest in friendRequests">
        <friend-request 
          :user="friendRequest">
        </friend-request>
      </template>
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
    },
    showEditProfile: () => globalStore.showEditProfile,
  },
  methods: {
    closeEditProfile: () => {
      globalStore.showEditProfile = false;
    },
    closeAbout: () => {
      globalStore.showAbout = false;
    },
  }
});