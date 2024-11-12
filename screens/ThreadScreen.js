import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { getForumPostsRoute, addForumPostRoute, upvotePostRoute, downvotePostRoute, deletePostRoute } from '../utils/APIRoutes';

const ThreadScreen = ({ route }) => {
  const { threadId } = route.params;
  const { user, token } = useContext(AuthContext);
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReplies, setShowReplies] = useState({});

  useEffect(() => {
    fetchThreadAndPosts();
  }, []);

  const fetchThreadAndPosts = async () => {
    try {
      const response = await axios.get(`${getForumPostsRoute}/${threadId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      // The data is already properly structured from the backend
      setThread(response.data.thread);
      setPosts(response.data.thread.posts);
    } catch (error) {
      console.error('Error fetching thread and posts:', error);
      Alert.alert('Error', 'Failed to load thread and posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPost = async () => {
    if (newPostContent.trim() && user && token) {
      try {
        const response = await axios.post(
          addForumPostRoute,
          {
            content: newPostContent,
            threadId: threadId,
            userId: user._id,
            parentId: replyingTo,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (response.data && response.data.post) {
          if (replyingTo) {
            // Update nested replies recursively
            const updateReplies = (posts) => {
              return posts.map(post => {
                if (post._id === replyingTo) {
                  return {
                    ...post,
                    replies: [...(post.replies || []), response.data.post]
                  };
                }
                if (post.replies && post.replies.length > 0) {
                  return {
                    ...post,
                    replies: updateReplies(post.replies)
                  };
                }
                return post;
              });
            };
            
            setPosts(currentPosts => updateReplies(currentPosts));
          } else {
            setPosts(currentPosts => [response.data.post, ...currentPosts]);
          }
          setNewPostContent('');
          setReplyingTo(null);
        }
      } catch (error) {
        console.error('Error creating new post:', error);
        Alert.alert('Error', 'Failed to create new post. Please try again.');
      }
    }
  };

  const updatePostVotes = (posts, postId, newUpvotes) => {
    return posts.map(post => {
      if (post._id === postId) {
        return { ...post, upvotes: newUpvotes };
      }
      if (post.replies && post.replies.length > 0) {
        return {
          ...post,
          replies: updatePostVotes(post.replies, postId, newUpvotes)
        };
      }
      return post;
    });
  };

  const handleVote = async (postId, isUpvote) => {
    try {
      const route = isUpvote ? upvotePostRoute : downvotePostRoute;
      const response = await axios.patch(route(postId, user._id), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Use the recursive function to update votes at any nesting level
      setPosts(currentPosts => updatePostVotes(currentPosts, postId, response.data.upvotes));
    } catch (error) {
      console.error('Error voting:', error.response?.data);
      Alert.alert('Error', 'Failed to register vote. Please try again.');
    }
  };

  const handleDelete = async (postId) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              await axios.delete(deletePostRoute(postId, user._id), {
                headers: { Authorization: `Bearer ${token}` }
              });
              setPosts(posts.filter(post => post._id !== postId));
              fetchThreadAndPosts();
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          }
        }
      ]
    );
  };

  const toggleReplies = (postId) => {
    setShowReplies((prevState) => ({ ...prevState, [postId]: !prevState[postId] }));
  };

  const renderReplyRecursive = ({ item, parentUsername, depth = 0 }) => {
    // Log the item to verify structure
    // console.log('Rendering reply:', item._id, 'with replies:', item.replies);
    
    return (
      <View key={item._id}>
        <View style={[
          styles.replyContainer, 
          { marginLeft: Math.min(depth * 2, 20) }
        ]}>
          <View style={[styles.postContent, { flex: 1 }]}>
          <View style={styles.replyBorder} />
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <SvgXml xml={atob(item.user.avatarImage)} width="40" height="40" />
              </View>
              <Text style={styles.postUser}>{item.user.username}</Text>
            </View>
            <Text style={styles.postText}>
              <Text style={{ fontStyle: 'italic', color: '#ccc' }}>
                @{parentUsername} •
              </Text>{' '}
              {item.content}
            </Text>
            <View style={styles.voteContainer}>
              <TouchableOpacity onPress={() => handleVote(item._id, true)}>
                <FontAwesome name="thumbs-up" size={16} color="#4a90e2" />
              </TouchableOpacity>
              <Text style={styles.voteCount}>{item.upvotes}</Text>
              <TouchableOpacity onPress={() => handleVote(item._id, false)}>
                <FontAwesome name="thumbs-down" size={16} color="#e24a4a" />
              </TouchableOpacity>
            </View>
            <View style={styles.postFooter}>
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => handleReply(item._id)}
              >
                <Text style={styles.replyButtonText}>Reply</Text>
              </TouchableOpacity>
              {user._id === item.user._id && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item._id)}
                >
                  <FontAwesome name="trash" size={16} color="#e24a4a" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        {/* Handle nested replies */}
        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            <TouchableOpacity onPress={() => toggleReplies(item._id)}>
              <Text style={styles.seeMoreRepliesText}>
                {showReplies[item._id] ? 'Hide replies' : `See ${item.replies.length} replies`}
              </Text>
            </TouchableOpacity>
            {showReplies[item._id] && (
              <View style={styles.nestedRepliesContainer}>
                {item.replies.map(reply => 
                  renderReplyRecursive({
                    item: reply,
                    parentUsername: item.user.username,
                    depth: depth + 1
                  })
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <SvgXml xml={atob(item.user.avatarImage)} width="50" height="50" />
          </View>
          <Text style={styles.postUser}>{item.user.username}</Text>
        </View>
        <Text style={styles.postText}>{item.content}</Text>
        <View style={styles.voteContainer}>
          <TouchableOpacity onPress={() => handleVote(item._id, true)}>
            <FontAwesome name="thumbs-up" size={20} color="#4a90e2" />
          </TouchableOpacity>
          <Text style={styles.voteCount}>{item.upvotes}</Text>
          <TouchableOpacity onPress={() => handleVote(item._id, false)}>
            <FontAwesome name="thumbs-down" size={20} color="#e24a4a" />
          </TouchableOpacity>
        </View>
        <View style={styles.postFooter}>
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => handleReply(item._id)}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
          {user._id === item.user._id && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item._id)}
            >
              <FontAwesome name="trash" size={20} color="#e24a4a" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {item.replies && item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          <TouchableOpacity onPress={() => toggleReplies(item._id)}>
            <Text style={styles.seeMoreRepliesText}>
              {showReplies[item._id] ? 'Hide replies' : `See ${item.replies.length} replies`}
            </Text>
          </TouchableOpacity>
          {showReplies[item._id] && item.replies.map((reply) =>
            renderReplyRecursive({
              item: reply,
              parentUsername: item.user.username,
              depth: 1
            })
          )}
        </View>
      )}
    </View>
  );

  const handleReply = (parentId) => {
    setReplyingTo(parentId);
    // console.log(parentId)
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!thread) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load thread. Please try again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 40}
      >
        <StatusBar barStyle="light-content" backgroundColor="#131324" />
        <Text style={styles.threadTitle}>{thread.title}</Text>
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderPost}
          style={styles.postList}
        />
        <View style={styles.newPostContainer}>
          <TextInput
            style={styles.newPostInput}
            placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
            placeholderTextColor="#888"
            value={newPostContent}
            onChangeText={setNewPostContent}
            multiline
          />
          <TouchableOpacity 
            style={[styles.newPostButton, !newPostContent.trim() && styles.disabledButton]} 
            onPress={handleNewPost}
            disabled={!newPostContent.trim()}
          >
            <FontAwesome name="send" size={20} color={newPostContent.trim() ? "#fff" : "#888"} />
          </TouchableOpacity>
        </View>
        {replyingTo && (
          <TouchableOpacity style={styles.cancelReply} onPress={() => setReplyingTo(null)}>
            <Text style={styles.cancelReplyText}>Cancel Reply</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#1e1e36',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#131324',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#131324',
  },
  errorText: {
    color: '#e24a4a',
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  threadTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    padding: 15,
    backgroundColor: '#1e1e36',
  },
  postList: {
    flex: 1,
  },
  nestedRepliesContainer: {
    marginLeft: 8,
  },
  newPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1e1e36',
  },
  newPostInput: {
    flex: 1,
    backgroundColor: '#252542',
    color: '#fff',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
    maxHeight: 100,
  },
  newPostButton: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#2a2a4c',
  },
  postContainer: {
    backgroundColor: '#1e1e36',
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 3,
  },
  postContent: {
    padding: 8,
  },
  replyContainer: {
    flexDirection: 'row',
    marginTop: 3,
    width: '100%',
  },
  replyBorder: {
    width: 0.5,
    backgroundColor: '#252542',
    marginRight: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  postUser: {
    fontWeight: 'bold',
    color: '#fff',
  },
  postText: {
    color: '#ccc',
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  voteCount: {
    color: '#fff',
    marginHorizontal: 5,
  },
  replyButton: {
    padding: 5,
  },
  replyButtonText: {
    color: '#4a90e2',
  },
  deleteButton: {
    padding: 5,
  },
  repliesContainer: {
    marginLeft: 5,
    borderLeftWidth: 1,
    borderLeftColor: '#252542',
  },
  seeMoreReplies: {
    marginTop: 5,
    padding: 5,
  },
  seeMoreRepliesText: {
    color: '#4a90e2',
    marginBottom: 15
  },
  cancelReply: {
    backgroundColor: '#e24a4a',
    padding: 10,
    alignItems: 'center',
  },
  cancelReplyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  avatar: {
    borderRadius: 50,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
});

export default ThreadScreen;