$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $mainNav = $('#main-nav-list');
  const $navSumbit = $('#nav-submit-story');
  const $favorite = $('#nav-favorites');
  const $myStories = $('#nav-my-stories');
  const $favoritedStories = $('#favorited-articles');
  const $userprofile = $('#user-profile');
  const $navUser = $('#nav-user-profile');


  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();
  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    try{
      const userInstance = await User.login(username, password);
      // set the global user to the user instance
      currentUser = userInstance;
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();
    }catch(e){
      $('#login-error').html('Invalid user');
    }
  });

  $navSumbit.on('click', function(){
    hideElements();
    if($submitForm.css('display')=='flex'){
      $submitForm.hide();
    }else{
      $submitForm.show();
    }
    $allStoriesList.show();
  })

  $favorite.on('click',function(e){
    hideElements();
    appendFavorites();
  })
  
  function appendFavorites(){
    $favoritedStories.html('');
    if(currentUser.favorites.length === 0){
      $favoritedStories.html('<p>No Favorites!</p>');
    }
    else{
      for(let fav of currentUser.favorites){
        const result = generateStoryHTML(fav);
        $favoritedStories.append(result);
        }
    }
    $favoritedStories.show();
  }
  $myStories.on('click',function(e){
    hideElements();
    $ownStories.html('');
    if(currentUser.ownStories.length === 0){
      $ownStories.html('<p>No own stories yet!</p>');
    }else{
      for(let story of currentUser.ownStories){
      const result = generateStoryHTML(story);
      $ownStories.append(result);
      }
    }
    $ownStories.show()
  })

  $submitForm.on('submit', async function(e){
    e.preventDefault();
    const author = $('#author').val();
    const title = $('#title').val();
    const url = $('#url').val();
    const story = {
     author, title, url
    }
    $submitForm.hide('fast');
    const newStory = await storyList.addStory(currentUser, story);
    const newList = generateStoryHTML(newStory);
    $allStoriesList.prepend(newList);
    $('#author').val('');
    $('#title').val('');
    $('#url').val('');

    checkIfLoggedIn();
  })

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  $navUser.on('click', function(){
    hideElements();
    const ISOdate = new Date(currentUser.createdAt);
    const year = ISOdate.getFullYear();
    const month = ISOdate.getMonth()+1;
    const day = ISOdate.getDate();
    $('#profile-name').html(`Name: ${currentUser.name}`);
    $('#profile-username').html(`Username: ${currentUser.username}`);
    $('#profile-account-date').html(`Account Created: ${month}/${day}/${year}`);
    $userprofile.show();
  })
  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  $allStoriesList.on('click','.heart', async function(e){
    if(!currentUser){
      return;
    }
    ['far','fas'].map(v => e.target.classList.toggle(v));
    const username = currentUser.username;
    const token = currentUser.loginToken;
    const storyId = $(this).parent().attr('id');
    if(e.target.classList.contains('fas')){
      await User.toggleFavorite(username,storyId,token,"POST");
    }else if(e.target.classList.contains('far')){
      await User.toggleFavorite(username,storyId,token,'DELETE');
    }
    checkIfLoggedIn();
    syncCurrentUserToLocalStorage();
  })

  $favoritedStories.on('click','.heart', async function(e){
    if(!currentUser){
      return;
    }
    ['far','fas'].map(v => e.target.classList.toggle(v));
    const username = currentUser.username;
    const token = currentUser.loginToken;
    const storyId = $(this).parent().attr('id');
    if(e.target.classList.contains('fas')){
      await User.toggleFavorite(username,storyId,token,"POST");
    }else if(e.target.classList.contains('far')){
      await User.toggleFavorite(username,storyId,token,'DELETE');
      $(this).parent().remove();
    }
    checkIfLoggedIn();
    syncCurrentUserToLocalStorage();

  })
  $allStoriesList.on('click','.garbage', async function(){
    if(!currentUser){
      return;
    }
    await deletingStory($(this));
  })
  $favoritedStories.on('click','.garbage', async function(){
    if(!currentUser){
      return;
    }
    await deletingStory($(this));
  })

  $ownStories.on('click','.garbage', async function(e){
    await deletingStory($(this));
  })
  
  async function deletingStory(thisObj){
    const token = currentUser.loginToken;
    const storyId = thisObj.parent().attr('id');
    const res = await storyList.deleteStory(token, storyId);
    thisObj.parent().remove();
    checkIfLoggedIn();
  }
  
  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }else{
      $navLogOut.hide();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    generateStories();
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    const hostName = getHostName(story.url);
    let storyMarkup ="";
    let favorited = 'far';
    let ownStories = '';
    const favorites = currentUser.favorites;
    if(favorites.some(val=> val.storyId === story.storyId)){
      favorited='fas';
    }
    const owns = currentUser.ownStories;
    if(owns.some(val=> val.storyId === story.storyId)){
      ownStories = '<span class="garbage"> <i class="far fa-trash-alt"></i></span>';
    }
      storyMarkup = $(`
      <li id="${story.storyId}">
        ${ownStories}
        <span class="heart">
          <i class="${favorited} fa-heart"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $favoritedStories,
      $userprofile
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $mainNav.show();
    $navLogin.hide();
    $navLogOut.show();
    $navUser.html(`${currentUser.username}`);

  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
      localStorage.setItem("favorites", currentUser.favorites);
      localStorage.setItem("ownStories", currentUser.ownStories);
    }
  }
});
