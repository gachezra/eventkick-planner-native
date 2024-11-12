//export const host = "http://localhost:5000";
export const host = "https://eventkick-server.onrender.com";


export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const updateUserRoute = (userId) => `${host}/api/auth/user/${userId}`;

export const saveTransactionRoute = `${host}/api/transactions`;
export const getTransactionRoute = `${host}/api/transactions`;

export const getReviewsRoute = `${host}/api/reviews/event`;
export const addReviewRoute = `${host}/api/reviews/add`;
export const deleteReviewRoute = `${host}/api/reviews`;
export const editReviewRoute = `${host}/api/reviews`;

export const getForumThreadsRoute = `${host}/api/forums/threads`;
export const addForumThreadRoute = `${host}/api/forums/add-thread`;
export const getForumPostsRoute = `${host}/api/forums/thread`;
export const addForumPostRoute = `${host}/api/forums/add-post`;
export const deleteThreadRoute = (threadId, userId) => `${host}/api/forums/threads/${threadId}/${userId}`;

export const deletePostRoute = (postId, userId) => `${host}/api/forums/posts/${postId}/${userId}`;
export const downvotePostRoute = (postId, userId) => `${host}/api/forums/posts/downvote/${postId}/${userId}`;
export const upvotePostRoute = (postId, userId) => `${host}/api/forums/posts/upvote/${postId}/${userId}`;

//event handlers
export const getApprovedEventsRoute = `${host}/api/events/admin/approved`;
export const getEventsRoute = `${host}/api/events/getevnt`;
export const getEventRoute = (eventId) => `${host}/api/events/${eventId}`;
export const addEventRoute = `${host}/api/events/addevnt`;
export const editEventRoute = (eventId) => `${host}/api/events/${eventId}`;
export const deleteEventRoute = (eventId) => `${host}/api/events/${eventId}`;
export const getUserEventsRoute = (userId) => `${host}/api/events/user/${userId}`;
export const registerEventRoute = (eventId) => `${host}/api/events/register/${eventId}`;

export const scanTicketRoute = (eventId, userId) => `${host}/api/events/scan/${eventId}/${userId}`

//comments
export const getCommentsRoute = (eventId) => `${host}/api/comments/event/${eventId}`;
export const addCommentRoute = `${host}/api/comments/add`;
export const deleteCommentRoute = (commentId, userId) => `${host}/api/comments/${commentId}/${userId}`;
