Vue.component('single-item', {
  props: ["item", "edit", "allowOrder", "editActions", "friendList"],
  data: function () {
    return {
      showDesc: false,
      showShareWith: false
    }
  },
  methods: {
    toggleDesc: function() {
      this.showDesc = !this.showDesc;
    }
  },
  template: `
    <div class="item">
      <div class="item-head">
        <span class="item-short-desc" @click="toggleDesc">{{ item.item }}</span>
        <span class="item-actions">
          <template v-if="edit">
            <template v-for="action in editActions">
              <span v-if="action === 'e'" class="item-archive item-menu decor-itemmenu" title="Edit">&#x1f589;</span>
              <span v-else-if="action === 'u'" class="item-archive item-menu decor-itemmenu" title="Unarchive">&#x21a9;</span>
              <span v-else-if="action === 'a'" class="item-archive item-menu decor-itemmenu" title="Archive">&#x21aa;</span>
              <span v-else-if="action === 'r'" class="item-delete item-menu decor-itemmenu" title="Remove from list">&#x2262;</span>
              <span v-else-if="action === 'd'" class="item-delete item-menu decor-itemmenu" title="Delete">&#x1f7a8;</span>
              <span v-else-if="action === 's'" class="item-share item-menu decor-itemmenu" title="Share" @click="showShareWith=true">&#x21cc;</span>
            </template>
          </template>
          <template v-else-if="allowOrder">
            <span class="item-archive item-menu decor-itemmenu" title="Up">&#x25b2;</span>
            <span class="item-delete item-menu decor-itemmenu" title="Down">&#x25bc;</span>
          </template>
        </span>
      </div>
      <div v-if="showDesc" class="item-long-desc">{{ item.desc }}</div>
      <div v-if="showShareWith" class="share-with-overlay decor-sharewithoverlay">
        <div class="share-with-wrapper">
          <div class="share-with-overlay-label">Friends:</div>
          <div class="share-with-content">
            <template v-for="friend in friendList">
              <span class="friend-item">
                <template v-if="item.sharedWith.includes(friend.email)">
                  <input type="checkbox" checked><span class="friend-item-name">{{ friend.name }}</span>
                </template>
                <template v-else>
                  <input type="checkbox"><span class="friend-item-name">{{ friend.name }}</span>
                </template>
              </span>
            </template>
          </div>
          <div class="share-with-overlay-actions">
            <button type="button" @click="showShareWith=false">&#x1f4be; Save</button>
            <button type="button" @click="showShareWith=false">&#x21b6; Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `
});

Vue.component('section-list', {
  props: ["sectionTooltip", "sectionTitle", "itemList", "sectionStyle", "sectionType", "friendList"],
  data: function () {
    return {
      edit: false,
      OWNER: OWNER,
      showAddNewItem: false
    }
  },
  computed: {
    allowOrder: function() { 
      switch(this.sectionType) {
        case "mine": case "friend": return true;
        case "archive": case "mine-friend": default: return false;
      }
    },
    editActions: function() {
      switch(this.sectionType) {
        case "mine": return ['e','a','d','s'];
        case "archive": return ['u','d'];
        case "mine-friend": return ['e','a','r','d','s'];
        case "friend": return ['e','d'];
        default: return [];
      }
    },
    allowNew: function() {
      switch(this.sectionType) {
        case "mine": case "mine-friend": case "friend": return true;
        case "archive": default: return false;
      }
    }
  },
  methods: {
    toggleEdit: function() {
      this.edit = !this.edit;
    }
  },
  template: `
    <div class="section decor-section" v-bind:style="sectionStyle">
      <div class="section-head decor-sectionhead">
        <div class="section-title decor-sectiontitle" v-bind:title="sectionTooltip">{{ sectionTitle }}</div>
        <div class="section-action decor-sectionaction">
          <template v-if="edit">
            <span v-on:click="toggleEdit" class="section-action-item decor-sectionactionitem" title="Update">&#x1f4be;</span>
            <span v-on:click="toggleEdit" class="section-action-item decor-sectionactionitem" title="Cancel">&#x21b6;</span>
          </template>
          <span v-else v-on:click="toggleEdit" class="section-action-item decor-sectionactionitem" title="Edit">&#x1f589;</span>
        </div>
      </div>
      <div class="section-content decor-sectioncontent">
        <template v-for="item in itemList">
          <single-item 
            v-bind:item="item"
            v-bind:edit="edit"
            v-bind:allow-order="allowOrder"
            v-bind:edit-actions="item.owner ? ( (item.owner === OWNER.FRIEND) ? []: editActions) : editActions"
            v-bind:friendList="friendList">
          </single-item>
        </template>        
        <div v-if="allowNew && edit" class="item">
          <div class="item-add-new item-menu decor-itemmenu" title="Add new prayer item" @click="showAddNewItem=true">&#x1f7a1;</div>
        </div>
        <div v-if="showAddNewItem" class="add-new-overlay decor-addnewoverlay">
          <div class="add-new-wrapper">
            <div class="add-new-overlay-label">Prayer item:</div>
            <input class="add-new-title" type="text">
            <div class="add-new-overlay-label">Long description:</div>
            <textarea class="add-new-content" rows="10"></textarea>
            <div class="add-new-overlay-actions">
              <button type="button" @click="showAddNewItem=false">&#x1f4be; Save</button>
              <button type="button" @click="showAddNewItem=false">&#x21b6; Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})




var app = new Vue({
  el: '#main',
  data: {
    sectionStyle: {
      width: "40%",
      height: "200px"
    },
    savedData: {
      lastEmailChecked: null,
      mine: {
        personId: "as8sc7d9ac",
        name: "Richard Wong",
        email: "ricwtk@gmail.com",
        personIdAtFriends: [],
        items: [{
          itemId: "fsaosi0923",
          item: "Item 0",
          desc: "Description for item 0.",
          sharedWith: [],
          order: 0,
          archived: false
        },{
          itemId: "12ondosoia",
          item: "Item 1",
          desc: "Description for item 1",
          sharedWith: ["friend0@domain.com"],
          order: 1,
          archived: false
        },{
          itemId: "fdsa70adf",
          item: "Item 2",
          desc: "Description for item 2",
          sharedWith: [],
          order: -1,
          archived: true
        }]
      },
      friends: [{
        friendId: "231khj24k",
        name: "Friend Name 0",
        email: "friend0@domain.com",
        items: [{
          itemId: "asdf987fda",
          item: "item 0",
          desc: "description for item 0",
          owner: OWNER.FRIEND,
          order: 0
        },{
          itemId: "fsd080",
          item: "item 1",
          desc: "description for item 1",
          owner: OWNER.MINE,
          order: 1
        }]
      },{
        friendId: "asdf9sadf8",
        name: "Friend Name 1",
        email: "friend1@domain.com",
        items: [{
          itemId: "asd080sdfa",
          item: "item 0",
          desc: "description for item 0",
          owner: OWNER.FRIEND,
          order: 0
        },{
          itemId: "asdf098f",
          item: "item 1",
          desc: "description for item 1",
          owner: OWNER.MINE,
          order: 1
        }]
      },{
        friendId: "dasf098d",
        name: "Friend Name 2",
        email: "friend2@domain.com",
        items: []
      },{
        friendId: "dsaf120",
        name: "Friend Name 3",
        email: "friend3@domain.com",
        items: []
      },{
        friendId: "d231sf9a",
        name: "Friend Name 4",
        email: "friend4@domain.com",
        items: []
      },{
        friendId: "fds098",
        name: "Friend Name 5",
        email: "friend5@domain.com",
        items: []
      }],
      friendRequests: []
    },
    showAsSingleList: true,
  },
  computed: {
    myItems: function() {
      var myitems = this.savedData.mine.items.filter(item => !item.archived);
      myitems.sort(function(a,b) {
        return a.order - b.order;
      })
      return myitems;
    },
    myArchived: function() {
      return this.savedData.mine.items.filter(item => item.archived);
    },
    mySharedWithList: function() {
      var allFriends = this.savedData.friends.map(friend => {
        return {
          name: friend.name, 
          email: friend.email, 
          items: this.savedData.mine.items.filter(item => (item.sharedWith.includes(friend.email)))};
      });
      console.log("allFriends", allFriends);
      return allFriends;
    }
  }
  // components: {
  //   "single-item": {
  //     props: ["itemTitle", "itemLongDesc", "edit"],
  //     data: {
  //       function () {
  //         return {
  //           showDesc: false
  //         }
  //       }
  //     },
  //     template: `
  //       <div class="item">
  //         <div class="item-head">
  //           <span class="item-short-desc">{{ itemTitle }}</span>
  //           <span class="item-actions">
  //             <template v-if="edit">
  //               <span class="item-archive item-menu decor-itemmenu" title="Archive">&#x21aa;</span>
  //               <span class="item-delete item-menu decor-itemmenu" title="Delete">&#x1f7a8;</span>
  //               <span class="item-share item-menu decor-itemmenu" title="Share">&#x21cc;</span>
  //             </template>
  //             <template v-else>
  //               <span class="item-archive item-menu decor-itemmenu" title="Up">&#x25b2;</span>
  //               <span class="item-delete item-menu decor-itemmenu" title="Down">&#x25bc;</span>
  //             </template>
  //           </span>
  //         </div>
  //         <div v-if="showDesc" class="item-long-desc">{{ itemLongDesc }}</div>
  //       </div>
  //     `
  //   },
  //   "section-list": {
  //     props: ["sectionTooltip", "sectionTitle", "itemList", "sectionStyle"],
  //     data: {
  //       function () {
  //         return {
  //           edit: false
  //         }
  //       }
  //     },
  //     template: `
  //       <div class="section decor-section" v-bind:style="sectionStyle">
  //         <div class="section-head decor-sectionhead">
  //           <div class="section-title decor-sectiontitle" v-bind:title="sectionTooltip">{{ sectionTitle }}</div>
  //           <div class="section-action decor-sectionaction">
  //             <template v-if="edit">
  //               <span v-on:click="edit=false" class="section-action-item decor-sectionactionitem" title="Cancel">&#x21b6;</span>
  //               <span v-on:click="edit=false" class="section-action-item decor-sectionactionitem" title="Update">&#x1f4be;</span>
  //             </template>
  //             <span v-else v-on:click="edit=true" class="section-action-item decor-sectionactionitem" title="Edit">&#x1f589;</span>
  //           </div>
  //         </div>
  //         <div class="section-content decor-sectioncontent">
  //           <template v-for="item in itemList">
  //             <single-item v-bind:item-title="item.item" v-bind:item-long-desc="item.desc" v-bind:edit="edit"></single-item>
  //           </template>
  //           <div class="item">
  //             <div class="item-add-new item-menu decor-itemmenu" title="Add new prayer item">&#x1f7a1;</div>
  //           </div>
  //         </div>
  //       </div>
  //     `
  //   }
  // } 
});

var app2 = new Vue({
  el: '#menu',
  data: {
    widthOfSection: app.sectionStyle.width,
    heightOfSection: app.sectionStyle.height
  }
});

var inputSectionWidth = document.getElementById("input-section-width");
inputSectionWidth.value = app.sectionStyle.width.replace("%", "");
inputSectionWidth.addEventListener("change", () => {
  app.sectionStyle.width = inputSectionWidth.value + '%';
  app2.widthOfSection = app.sectionStyle.width;
});

var inputSectionHeight = document.getElementById("input-section-height");
inputSectionHeight.value = app.sectionStyle.height.replace("px", "");
inputSectionHeight.addEventListener("change", () => {
  app.sectionStyle.height = inputSectionHeight.value + 'px';
  app2.heightOfSection = app.sectionStyle.height;
});
// console.log("width", document.getElementById("input-section-width").value);
// console.log("height", document.getElementById("input-section-height").value);