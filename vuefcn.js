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
    }
  },
  computed: {
    showSignIn: function () {
      return !(this.fblogin || this.googlelogin);
    },
  },
  watch: {
    initToast: function () {
      if (this.initToast) {
        this.initToast = false;
        showDebug(["toast-notification", this.toastMessage]);
        this.showToast = true;
        if (this.toastTimeoutFn !== null) {
          clearTimeout(this.toastTimeoutFn);
        }
        this.toastTimeoutFn = setTimeout(() => {
          this.showToast = false;
        }, 2000);
      }
    },
    // toastMessage: function () {
    //   showDebug(["toast-notification", this.toastMessage]);
    //   this.showToast = true;
    //   if (this.toastTimeoutFn !== null) {
    //     clearTimeout(this.toastTimeoutFn);
    //   }
    //   this.toastTimeoutFn = setTimeout(() => {
    //     this.showToast = false;
    //   }, 2000);
    // }
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
      console.log("updated friend list", copyObj(this.searchFriendList));
      let result = [];
      if (this.searchFriendList.length < 1) {
        result.push("no search string");
      } else {
        console.log("searchFriendResults", copyObj(this.searchFriendList));
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
      if (friendList.includes(this.searchFriendString)) {
        // this.addPrivateError = true;
        console.log(this.searchFriendString + " is in existing friend list");
        showToast(this.searchFriendString + " is in existing friend list");
      } else {
        addToFriend(null, this.searchFriendString);
        console.log("Save '" + this.searchFriendString + "' to friend list");
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
        showDebug([this.newFriendEmail + " is in existing friend list"]);
        return null;
      }
      // else, if in friend requests list, send accept email, remove friend request, add to friends list
      if (friendRequestList.includes(this.newFriendEmail)) {
        sendAccept(this.newFriendEmail).then(() => {
          showDebug(["'" + this.newFriendEmail + "' is added to friend list"]);
          acceptFriendRequest(this.newFriendEmail);
          updateToDatabase();
        })
        return null;
      }
      // else, send invite email
      sendInvite(this.newFriendEmail).then(() => {
        showDebug(["Invite is sent to '" + this.newFriendEmail + "'"]);
        showToast("sent invite to " + this.newFriendEmail);
        this.newFriendEmail = '';
        this.showOverlay = false;
      }, () => {
        this.addEmailError = true;
        showToast("error adding " + this.newFriendEmail);
        showDebug(["Error adding " + this.newFriendEmail]);
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
      showDebug([copyObj(globalStore.savedData)]);
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

Vue.component('single-friend-to-share', {
  props: ["isChecked", "friend"],
  data: function () {
    return {}
  },
  methods: {
    toggleState: function () {
      this.$emit('change', {
        isChecked: !this.isChecked,
        friendEmail: this.friend.email
      });
    }
  },
  template: `
    <span class="friend-item" :title="friend.email">
      <input type="checkbox" :checked="isChecked" @change="toggleState"><span class="friend-item-name">{{ friend.name }}</span>
    </span>
  `
});

Vue.component('share-with-overlay', {
  props: ["item"],
  computed: {
    friendList: function () {
      return globalStore.savedData.friends.filter(friend => (friend.email !== null));
    }
  },
  methods: {
    closeThis: function () {
      this.$emit('close');
    },
    updateShareWithList: function (detail) {
      if (detail.isChecked) {
        showDebug(["sharedWith list: added '" + detail.friendEmail + "'"]);
        this.item.sharedWith.push(detail.friendEmail);
      } else {
        showDebug(["sharedWith list: removed '" + detail.friendEmail + "'"]);
        var idx = this.item.sharedWith.findIndex(x => (x == detail.friendEmail));
        this.item.sharedWith.splice(idx, 1);
      }
      this.item.edit = true;
    }
  },
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-wrapper">
        <div class="overlay-label">Friends:</div>
        <div v-if="friendList.length == 0">Invite friends using emails to share prayer items.</div>
        <div class="share-with-content">
          <template v-for="friend in friendList">
            <single-friend-to-share 
              :isChecked="item.sharedWith.includes(friend.email)" 
              :friend="friend"
              @change="updateShareWithList">
            </single-friend-to-share>
          </template>
        </div>
        <div class="overlay-actions">
          <button type="button" @click="closeThis"><i class="fa fa-times"></i> Close</button>
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
        showDebug(["tag list: added '" + detail.tag + "'"]);
        this.item.tags.push(detail.tag);
      } else {
        showDebug(["tag list: removed '" + detail.tag + "'"]);
        var idx = this.item.tags.findIndex(x => (x == detail.tag));
        this.item.tags.splice(idx, 1);
      }
      this.item.edit = true;
      showDebug([copyObj(this.item)]);
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

Vue.component('section-list', {
  props: ["sectionTooltip", "sectionTitle", "itemList", "sectionTypeData"],
  // sectionTypeData = { sType: "", data: null }
  data: function () {
    return {
      edit: false,
      showAddNewItem: false,
      clonedItemList: [],
      moving: null,
      showEditName: false
    }
  },
  computed: {
    sectionStyle: () => {
      return globalStore.savedData.ui.sectionStyle;
    },
    allowOrder: function () {
      switch (this.sectionTypeData.sType) {
        case "mine":
        case "friend":
          return true;
        case "archive":
        case "mine-friend":
        case "mine-tag":
        default:
          return false;
      }
    },
    editActions: function () {
      switch (this.sectionTypeData.sType) {
        case "mine":
          return ['e', 'a', 'd', 's', 't'];
        case "archive":
          return ['u', 'd'];
        case "mine-friend":
          if (this.sectionTitle == 'Unshared') return ['e', 'a', 'd', 's', 't'];
          return ['e', 'a', 'd', 's', 't', 'r'];
        case "mine-tag":
          if (this.sectionTitle == 'Untagged') return ['e', 'a', 'd', 's', 't'];
          return ['e', 'a', 'd', 's', 't', 'r'];
        case "friend":
          return ['e', 'd'];
        default:
          return [];
      }
    },
    allowNew: function () {
      switch (this.sectionTypeData.sType) {
        case "mine":
        case "friend":
          return true;
        case "mine-friend":
        case "mine-tag":
        case "archive":
        default:
          return false;
      }
    },
    allowRemove: function () {
      switch (this.sectionTypeData.sType) {
        case "friend":
          return (this.sectionTooltip == null);
        default:
          return false;
      }
    },
    allowEditName: function () {
      switch (this.sectionTypeData.sType) {
        case "friend":
          return true;
        default:
          return false;
      }
    },
    displayItemList: function () {
      var myList = this.clonedItemList.filter(item => !item.deleted);
      switch (this.sectionTypeData.sType) {
        case "mine-tag":
          if (this.sectionTitle !== 'Untagged')
            myList = myList.filter(item => item.tags.includes(this.sectionTitle));
          break;
        case "mine-friend":
          if (this.sectionTitle !== 'Unshared')
            myList = myList.filter(item => item.sharedWith.includes(this.sectionTooltip));
          break;
        default:
          break;
      }
      switch (this.sectionTypeData.sType) {
        case "mine":
        case "mine-tag":
        case "mine-friend":
          return myList.filter(item => !item.archived);
        case "archive":
          return myList.filter(item => item.archived);
        default:
          return myList;
      }
    },
  },
  watch: {
    'itemList': function () {
      this.syncClonedWithOri();
    }
  },
  methods: {
    findItemById: function (itemList, itemId) {
      return itemList.filter(item => (item.itemId == itemId))[0];
    },
    findItemByOrder: function (itemList, itemOrder) {
      return itemList.filter(item => (item.order == itemOrder))[0];
    },
    syncClonedWithOri: function () {
      // showDebug(["syncClonedWithOri", copyObj(this.itemList)]);
      this.clonedItemList = copyObj(this.itemList);
      this.clonedItemList = this.clonedItemList.map(item => {
        return Object.assign({}, item, {
          edit: false,
          deleted: false
        });
      });
      this.clonedItemList.sort(function (a, b) {
        return a.order - b.order;
      });
    },
    removeSection: function () {
      this.$emit("remove", this.sectionTypeData.data.friendId);
      this.edit = false;
    },
    moveUp: function (itemId) {
      showDebug(["move '" + itemId + "' up"]);
      var itemToMove = this.findItemById(this.itemList, itemId);
      if (itemToMove.order !== 0) {
        var itemToSwap = this.findItemByOrder(this.itemList, itemToMove.order - 1);
        itemToSwap.order += 1;
        itemToMove.order -= 1;
      }
      this.syncClonedWithOri();
    },
    moveDown: function (itemId) {
      showDebug(["move '" + itemId + "' down"]);
      var itemToMove = this.findItemById(this.itemList, itemId);
      var lastOrder = Math.max(...this.itemList.filter(item => (item.order > -1)).map(item => item.order));
      if (itemToMove.order !== lastOrder) {
        var itemToSwap = this.findItemByOrder(this.itemList, itemToMove.order + 1);
        itemToSwap.order -= 1;
        itemToMove.order += 1;
      }
      this.syncClonedWithOri();
    },
    setArchived: function (itemId) {
      showDebug(["archived '" + itemId + "'"]);
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.archived = true;
      itemToEdit.edit = true;
      itemToEdit.order = -1;
      itemToEdit.tags = [];
      itemToEdit.sharedWith = [];
    },
    setUnarchived: function (itemId) {
      showDebug(["unarchived '" + itemId + "'"])
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.archived = false;
      itemToEdit.edit = true;
    },
    deleteItem: function (itemId) {
      showDebug(["delete '" + itemId + "'"]);
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.deleted = true;
      itemToEdit.edit = true;
    },
    removeFromList: function (itemId) {
      showDebug(["remove '" + itemId + "' from list"]);
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      if (this.sectionTypeData.sType == 'mine-friend') {
        var idx = itemToEdit.sharedWith.findIndex(x => (x == this.sectionTooltip));
        itemToEdit.sharedWith.splice(idx, 1);
      } else if (this.sectionTypeData.sType == 'mine-tag') {
        var idx = itemToEdit.tags.findIndex(x => (x == this.sectionTitle));
        itemToEdit.tags.splice(idx, 1);
      }
      showDebug([copyObj(itemToEdit)]);
      itemToEdit.edit = true;
    },
    createNew: function (newItem) {
      newItem.itemId = generateId(this.clonedItemList.map(item => item.itemId));
      newItem.order = Math.max(...this.clonedItemList.filter(item => (item.order > -1)).map(item => item.order)) + 1;
      if (newItem.order == -Infinity) newItem.order = 0;
      if (this.sectionTypeData.sType == "friend") {
        newItem.owner = "mine";
      }
      showDebug(["add item: ", copyObj(newItem)]);
      this.clonedItemList.splice(this.clonedItemList.length, 1, newItem);
    },
    saveEdit: function () {
      showDebug(["update list", copyObj(this.clonedItemList)]);
      var saveToItemList;
      switch (this.sectionTypeData.sType) {
        case "mine":
        case "archive":
        case "mine-tag":
        case "mine-friend":
          saveToItemList = globalStore.savedData.items;
          break;
        default:
          saveToItemList = this.itemList;
      }
      var friendsToUpdate = [];
      this.clonedItemList.forEach((item) => {
        if (item.edit) {
          var itemToEdit = this.findItemById(saveToItemList, item.itemId);
          if (itemToEdit == undefined) {
            var newItem;
            if (this.sectionTypeData.sType == 'friend') {
              newItem = newFriendItem();
            } else {
              newItem = newMineItem();
            }
            for (k in newItem) {
              if (k == "sharedWith") {
                friendsToUpdate.push(...item[k]);
              }
              this.$set(newItem, k, item[k]);
            }
            saveToItemList.splice(saveToItemList.length, 1, newItem);
          } else {
            if (item.deleted) {
              saveToItemList.splice(saveToItemList.findIndex(it => it.itemId == item.itemId), 1);
              friendsToUpdate.push(...item.sharedWith);
            } else {
              for (k in itemToEdit) {
                if (k == "sharedWith") {
                  friendsToUpdate.push(...itemToEdit[k]);
                  friendsToUpdate.push(...item[k]);
                }
                this.$set(itemToEdit, k, item[k]);
              }
            }
          }
        }
      });
      friendsToUpdate = [...new Set(friendsToUpdate)];
      // reorder
      saveToItemList = saveToItemList.filter(item => !item.archived);
      saveToItemList.sort((a, b) => {
        if (a.order == -1 && b.order == -1)
          return 0;
        else if (a.order == -1)
          return 1;
        else if (b.order == -1)
          return -1;
        else
          return a.order - b.order;
      });
      saveToItemList.map((item, index) => {
        item.order = index;
      })
      updateToDatabase();
      if (friendsToUpdate.length > 0) {
        updateAndSendSharedList(friendsToUpdate);
      }
      this.edit = false;
    },
    cancelEdit: function () {
      this.edit = false;
      this.syncClonedWithOri();
    }
  },
  created: function () {
    this.syncClonedWithOri();
  },
  template: `
    <div class="section decor-section" v-bind:style="sectionStyle">
      <div class="section-head decor-sectionhead">
        <div class="section-action decor-sectionaction" v-if="edit && allowEditName">
          <span @click="showEditName = true" class="section-action-item decor-sectionactionitem" title="Edit name"><i class="fa fa-pencil"></i></span>
          <edit-name-overlay 
            v-if="showEditName" 
            :name="sectionTypeData.data.name" 
            @save="(name) => { sectionTypeData.data.name = name; }"
            @close="showEditName = false">
          </edit-name-overlay>
        </div>
        <div class="section-title decor-sectiontitle" v-bind:title="sectionTooltip">{{ sectionTitle }}</div>
        <div class="section-action decor-sectionaction">
          <template v-if="edit">
            <span v-if="allowRemove" @click="removeSection" class="section-action-item decor-sectionactionitem" title="Remove"><i class="fa fa-user-times"></i></span>
            <span @click="saveEdit" class="section-action-item decor-sectionactionitem" title="Update"><i class="fa fa-save"></i></span>
            <span @click="cancelEdit" class="section-action-item decor-sectionactionitem" title="Cancel"><i class="fa fa-undo"></i></span>
          </template>
          <span v-else @click="edit=true" class="section-action-item decor-sectionactionitem" title="Edit"><i class="fa fa-pencil"></i></span>
        </div>
      </div>
      <div class="section-content decor-sectioncontent">
        <template v-for="item in displayItemList">
          <single-item 
            v-bind:item="item"
            v-bind:edit="edit"
            v-bind:allow-order="allowOrder"
            v-bind:edit-actions="item.owner ? ( (item.owner === 'friend') ? []: editActions) : editActions"
            @moveUp="moveUp"
            @moveDown="moveDown"
            @setArchived="setArchived"
            @setUnarchived="setUnarchived"
            @deleteItem="deleteItem"
            @removeFromList="removeFromList">
          </single-item>
        </template>        
        <div v-if="allowNew && edit" class="item">
          <div class="item-add-new item-menu decor-itemmenu" title="Add new prayer item" @click="showAddNewItem=true"><i class="fa fa-plus"></i></div>
        </div>
        <edit-item-overlay 
          v-if="showAddNewItem" 
          @close="showAddNewItem=false" 
          @createNew="createNew"
          action="new"
          :sectionType="sectionTypeData.sType"
          :item="[]">
        </edit-item-overlay>
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
  props: ["name", "email"],
  data: function () {
    return {}
  },
  methods: {
    acceptRequest: function () {
      showDebug(["acceptRequest"]);
      // send email to accept
      sendAccept(this.email).then(() => {
        acceptFriendRequest(this.email);
        updateToDatabase();
        showDebug(["Successfully accepted " + this.name + " (" + this.email + ") as friend"])
      }, () => {
        showDebug(["Error accepting " + this.name + " (" + this.email + ") as friend"])
      });
    },
    rejectRequest: function () {
      showDebug(["rejectRequest"]);
      let indexOfRequest = globalStore.savedData.friendRequests.findIndex(friend => friend.email == this.email);
      globalStore.savedData.friendRequests.rejected = true;
      updateToDatabase();
    }
  },
  template: `
    <span class="menu-item friend-invite">
      <span class="friend-invite-identity">
        <span class="friend-invite-name">{{ name }}</span><br>
        <span class="friend-invite-email">{{ email }}</span>
      </span>
      <span class="friend-invite-actions">
        <span class="friend-invite-accept decor-menuitem" @click="acceptRequest"><i class="fa fa-plus"></i></span>
        <span class="friend-invite-reject decor-menuitem" @click="rejectRequest"><i class="fa fa-times"></i></span>
      </span>
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
      return globalStore.savedData.friendRequests;
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
      showDebug(["saveUi"]);
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
          v-if="!friendRequest.rejected" 
          :name="friendRequest.name"
          :email="friendRequest.email">
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
      // var shareableFriends = savedData.friends.filter(friend => friend.email);
      var shareableFriends = globalStore.savedData.friends;
      var allFriends = shareableFriends.map(friend => {
        return {
          name: friend.name,
          email: friend.email,
          items: globalStore.savedData.items.filter(item => (item.sharedWith.includes(friend.email)))
        };
      });
      showDebug(["allFriends", allFriends]);
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
      showDebug(["allTags", copyObj(allTags)])
      return allTags;
    },
    myUntagged: function () {
      return globalStore.savedData.items.filter(item => (item.tags.length == 0));
    }
  },
  methods: {
    removeFriend: function (friendId) {
      var indexOfFriend = globalStore.savedData.friends.findIndex((friend) => friend.friendId == friendId);
      showDebug(["remove '" + globalStore.savedData.friends[indexOfFriend].name + "' (id: " + globalStore.savedData.friends[indexOfFriend].friendId + ")"]);
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