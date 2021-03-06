Vue.component('section-list', {
  props: ["sectionTooltip", "sectionTitle", "itemList", "sectionTypeData"],
  // sectionTypeData = { sType: "", data: null }
  data: function () {
    return {
      edit: false,
      showAddNewItem: false,
      clonedItemList: [],
      moving: null,
      showEditName: false,
      showSectionDescription: false
    }
  },
  computed: {
    sectionStyle: () => {
      return globalStore.savedData.ui.sectionStyle;
    },
    idpClass: function () {
      let user = this.sectionTypeData.data || { userId: "" };
      return {
        fa: true,
        "fa-google-plus-official": user.userId.startsWith("g"),
        "fa-facebook-official": user.userId.startsWith("fb")
      };
    },
    sectionTitleClass: function() {
      let clickable = false;
      if (Array("friend", "mine-friend").includes(this.sectionTypeData.sType)) {
        if (this.sectionTypeData.data) {
          let userId = this.sectionTypeData.data.userId;
          if (userId.startsWith("g") || userId.startsWith("fb")) {
            clickable = true;
          }
        }
      }
      return {
        "section-title": true,
        "decor-sectiontitle": true,
        "clickable": clickable
      }
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
          return (this.sectionTypeData.data.userId.startsWith("pri"));
        default:
          return false;
      }
    },
    allowEditName: function () {
      switch (this.sectionTypeData.sType) {
        case "friend":
          return (this.sectionTypeData.data.userId.startsWith("pri"));
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
            myList = myList.filter(item => item.sharedWith.includes(this.sectionTypeData.data.userId));
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
    userDetails: function () {
      if (this.sectionTitleClass.clickable) {
        return globalStore.connectedFriendsDetails.find(it => it.userId == this.sectionTypeData.data.userId);
      } else {
        return null;
      }
    }
  },
  watch: {
    'itemList': function () {
      this.syncClonedWithOri();
    }
  },
  methods: {
    directToSocial: function () {
      if (this.userDetails) {
        window.open(this.userDetails.profileLink, "_blank");
      }
    },
    findItemById: function (itemList, itemId) {
      return itemList.filter(item => (item.itemId == itemId))[0];
    },
    findItemByOrder: function (itemList, itemOrder) {
      return itemList.filter(item => (item.order == itemOrder))[0];
    },
    syncClonedWithOri: function () {
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
    sectionTitleOnClick: function() {
      if (this.sectionTitleClass.clickable) {
        this.showSectionDescription = !this.showSectionDescription;
      }
    },
    removeSection: function () {
      this.$emit("remove", this.sectionTypeData.data.friendId);
      this.edit = false;
    },
    moveUp: function (itemId) {
      if (DEBUG) console.log("move '" + itemId + "' up");
      var itemToMove = this.findItemById(this.itemList, itemId);
      if (itemToMove.order !== 0) {
        var itemToSwap = this.findItemByOrder(this.itemList, itemToMove.order - 1);
        itemToSwap.order += 1;
        itemToMove.order -= 1;
      }
      updateToDatabase();
      this.syncClonedWithOri();
    },
    moveDown: function (itemId) {
      if (DEBUG) console.log("move '" + itemId + "' down");
      var itemToMove = this.findItemById(this.itemList, itemId);
      var lastOrder = Math.max(...this.itemList.filter(item => (item.order > -1)).map(item => item.order));
      if (itemToMove.order !== lastOrder) {
        var itemToSwap = this.findItemByOrder(this.itemList, itemToMove.order + 1);
        itemToSwap.order -= 1;
        itemToMove.order += 1;
      }
      updateToDatabase();
      this.syncClonedWithOri();
    },
    setArchived: function (itemId) {
      if (DEBUG) console.log("archived '" + itemId + "'");
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.archived = true;
      itemToEdit.edit = true;
      itemToEdit.order = -1;
      itemToEdit.tags = [];
      itemToEdit.sharedWith = [];
    },
    setUnarchived: function (itemId) {
      if (DEBUG) console.log("unarchived '" + itemId + "'");
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.archived = false;
      itemToEdit.edit = true;
    },
    deleteItem: function (itemId) {
      if (DEBUG) console.log("delete '" + itemId + "'");
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.deleted = true;
      itemToEdit.edit = true;
    },
    removeFromList: function (itemId) {
      if (DEBUG) console.log("remove '" + itemId + "' from list");
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      if (this.sectionTypeData.sType == 'mine-friend') {
        var idx = itemToEdit.sharedWith.findIndex(x => (x == this.sectionTooltip));
        itemToEdit.sharedWith.splice(idx, 1);
      } else if (this.sectionTypeData.sType == 'mine-tag') {
        var idx = itemToEdit.tags.findIndex(x => (x == this.sectionTitle));
        itemToEdit.tags.splice(idx, 1);
      }
      if (DEBUG) console.log(copyObj(itemToEdit));
      itemToEdit.edit = true;
    },
    createNew: function (newItem) {
      newItem.itemId = generateId(this.clonedItemList.map(item => item.itemId));
      newItem.order = Math.max(...this.clonedItemList.filter(item => (item.order > -1)).map(item => item.order)) + 1;
      if (newItem.order == -Infinity) newItem.order = 0;
      if (this.sectionTypeData.sType == "friend") {
        newItem.owner = "mine";
      }
      if (DEBUG) console.log("add item: ", copyObj(newItem));
      this.clonedItemList.splice(this.clonedItemList.length, 1, newItem);
    },
    saveEdit: function () {
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
              if (["sharedWith","tags"].includes(k)) {
                this.$set(newItem, k, Vue.util.extend([], item[k]));
              } else {
                this.$set(newItem, k, item[k]);              
              }
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
                if (["sharedWith","tags"].includes(k)) {
                  this.$set(itemToEdit, k, Vue.util.extend([], item[k]));
                } else {
                  this.$set(itemToEdit, k, item[k]);              
                }
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
    <div class="section decor-section">
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
        <div :class="sectionTitleClass" :title="sectionTooltip" @click="sectionTitleOnClick">{{ sectionTitle }} <i :class=idpClass></i></div>
        <div class="section-action decor-sectionaction">
          <template v-if="edit">
            <span v-if="allowRemove" @click="removeSection" class="section-action-item decor-sectionactionitem" title="Remove"><i class="fa fa-user-times"></i></span>
            <span @click="saveEdit" class="section-action-item decor-sectionactionitem" title="Update"><i class="fa fa-save"></i></span>
            <span @click="cancelEdit" class="section-action-item decor-sectionactionitem" title="Cancel"><i class="fa fa-undo"></i></span>
          </template>
          <span v-else @click="edit=true" class="section-action-item decor-sectionactionitem" title="Edit"><i class="fa fa-pencil"></i></span>
        </div>
      </div>
      <div v-if="sectionTitleClass.clickable && showSectionDescription" class="section-description">
        <user-details-actions 
          :user="userDetails"
          actions="l"
          p-pic-style="width: 70px">
        </user-details-actions>
      </div>
      <div class="section-content decor-sectioncontent" :style="sectionStyle">
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

Vue.component('single-item', {
  props: ["item", "edit", "allowOrder", "editActions"],
  data: function () {
    return {
      showDesc: false,
      showEdit: false,
      searchToShare: "",
      isShareFocus: false
    }
  },
  computed: {
    caret: function () {
      return {
        fa: true,
        "fa-minus-square": this.showDesc,
        "fa-plus-square": !this.showDesc,
        "item-indicator": true
      }
    },
    allTags: function () {
      let tags = [];
      globalStore.savedData.items.forEach(item => {
        tags = tags.concat(item.tags.filter(tag => tags.indexOf(tag) < 0));
      });
      tags = tags.concat(this.item.tags.filter(tag => tags.indexOf(tag) < 0));
      return tags;
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
    editItem: function () {
      this.showEdit = true;
    },
    setArchived: function () {
      this.$emit('setArchived', this.item.itemId);
      this.remindSave("Archive");
    },
    setUnarchived: function () {
      this.$emit('setUnarchived', this.item.itemId);
      this.remindSave("Unarchive");
    },
    deleteItem: function () {
      this.$emit('deleteItem', this.item.itemId);
      this.remindSave("Delete");
    },
    removeFromList: function () {
      this.$emit('removeFromList', this.item.itemId);
      this.remindSave("Remove from list");
    },
    remindSave: function (action) {
      showToast(action + " is temporary until saved");
    },
    getUserInText: function (userId) {
      if (globalStore.connectedFriendsDetails.length > 0) {
        let thisFriend = globalStore.connectedFriendsDetails.find(fr => fr.userId == userId);
        return thisFriend.name;
      }
    },
    getUserIdpClass: function (userId) {
      return {
        fa: true,
        "fa-google-plus-official": userId.startsWith("g"),
        "fa-facebook-official": userId.startsWith("fb"),
      }
    },
    addNewTag: function (evt) {
      let newTag = evt.target.value;
      // check if tag is already added
      if (!this.item.tags.includes(newTag) && newTag != "") {
        // if not add tag to this item
        this.item.tags.push(newTag);
        if (DEBUG) console.log("Added \"" + newTag + "\" tag to \"" + this.item.item + "\"");
        // tag item as editted
        this.item.edit = true;
      }
      // set text box to blank
      evt.target.value = "";
    },
    removeTag: function (tagname) {
      let idx = this.item.tags.findIndex(x => (x == tagname));
      this.item.tags.splice(idx, 1);
      if (DEBUG) console.log("Removed \"" + tagname + "\" tag from \"" + this.item.item + "\"");
      this.item.edit = true;
    },
    shareToNewFriend: function (userId) {
      if (!this.item.sharedWith.includes(userId)) {
        // if not add tag to this item
        this.item.sharedWith.push(userId);
        // tag item as editted
        this.item.edit = true;
      }
      // set text box to blank
      this.searchToShare = "";
    },
    removeShared: function (userId) {
      let idx = this.item.sharedWith.findIndex(x => (x == userId));
      this.item.sharedWith.splice(idx, 1);
      this.item.edit = true;
    },
    focusAddShare: function () {
      this.isShareFocus = true;
      Vue.nextTick(() => {
        window.addEventListener("click", this.checkAddShareFocus);
      });
    },
    checkAddShareFocus: function (evt) {
      if (this.$refs.searchList) {
        if (!this.$refs.searchList.$el.contains(evt.target) && !evt.target.isSameNode(this.$refs.searchInput)) {
          this.isShareFocus = false;
          window.removeEventListener("click", this.checkAddShareFocus);
        }
      }
    },
    blurAddShare: function () {
      this.isShareFocus = false;
    }
  },
  watch: {
    showEdit: function () {
      if (!this.showEdit) this.remindSave("Edit");
    },
    edit: function () {
      if (!this.edit) this.searchToShare = "";
    }
  },
  template: `
    <div class="item">
      <div class="item-head">
        <span :class="caret" @click="toggleDesc"></span>
        <span class="item-short-desc" @click="toggleDesc">{{ item.item }}</span>
        <span class="item-actions">
          <template v-if="edit">
            <template v-for="action in editActions">
              <span v-if="action === 'e'" class="item-archive item-menu decor-itemmenu" title="Edit" @click="editItem"><i class="fa fa-pencil"></i></span>
              <span v-else-if="action === 'u'" class="item-archive item-menu decor-itemmenu" title="Unarchive" @click="setUnarchived"><i class="fa fa-upload"></i></span>
              <span v-else-if="action === 'a'" class="item-archive item-menu decor-itemmenu" title="Archive" @click="setArchived"><i class="fa fa-download"></i></span> <!--fa-angle-double-right-->
              <span v-else-if="action === 'r'" class="item-delete item-menu decor-itemmenu" title="Remove from list" @click="removeFromList"><i class="fa fa-outdent"></i></span>
              <span v-else-if="action === 'd'" class="item-delete item-menu decor-itemmenu" title="Delete" @click="deleteItem"><i class="fa fa-times"></i></span>
            </template>
          </template>
          <template v-else-if="allowOrder">
            <span class="item-archive item-menu decor-itemmenu" title="Up" @click="moveUp"><i class="fa fa-chevron-up"></i></span>
            <span class="item-delete item-menu decor-itemmenu" title="Down" @click="moveDown"><i class="fa fa-chevron-down"></i></span>
          </template>
        </span>
      </div>
      <div v-if="showDesc" class="item-long-desc">
        {{ item.desc }}
        <template v-if="editActions.includes('s')">
          <div v-if="edit || (item.sharedWith && item.sharedWith.length > 0)" class="share-list-in-text">
            <i class="fa fa-share-alt"></i>
            <div v-for="userId in item.sharedWith" class="user-in-text">
              {{ getUserInText(userId) }}
              <i :class="getUserIdpClass(userId)"></i>
              <i v-if="edit" class="fa fa-times" @click="removeShared(userId)"></i>
            </div>
            <div v-if="edit">
              <input class="addShareTags" v-model="searchToShare" @focus="focusAddShare" ref="searchInput"><!-- @blur="blurAddShare">-->
              <search-list-to-share v-if="isShareFocus" 
                :searchString="searchToShare" 
                @selected="shareToNewFriend"
                ref="searchList">
              </search-list-to-share>
            </div>
          </div>
        </template>
        <template v-if="editActions.includes('t')">
          <div v-if="edit || (item.tags && item.tags.length > 0)" class="tag-list-in-text">
            <i class="fa fa-tags"></i>
            <div v-for="tag in item.tags" class="tag-in-text">
              {{ tag }}
              <i v-if="edit" class="fa fa-times" @click="removeTag(tag)"></i>
            </div>
            <div v-if="edit">
              <input list="tags" class="addShareTags" @keyup.enter="addNewTag">
              <datalist id="tags">
                <option v-for="singleTag in allTags" :value="singleTag">
              </datalist>
            </div>
          </div>
        </template>
      </div>
      <edit-item-overlay 
        v-if="showEdit" 
        action="edit"
        :item="item"
        sectionType=""
        @close="showEdit=false">
      </edit-item-overlay>
    </div>
  `
});

Vue.component("search-list-to-share", {
  props: ['searchString'],
  computed: {
    filteredList: function () {
      if (this.searchString == "") {
        return [];
      } else {
        return globalStore.connectedFriendsDetails.filter(fd => fd.searchField.includes(this.searchString));
      }
    }
  },
  methods : {
    selectUser: function (user) {
      this.$emit("selected", user.userId);
    }
  },
  template: `
    <div v-if="filteredList.length > 0" class="search-list-to-share">
      <user-details-actions v-for="fl in filteredList"
        :user="fl" @click="selectUser">
      </user-details-actions>
    </div>
  `
});

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