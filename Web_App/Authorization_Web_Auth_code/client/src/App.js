import './App.css';
import { RouterProvider, createBrowserRouter, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Card, Image, Table } from 'react-bootstrap';

axios.defaults.withCredentials = true;

const serverUrl = process.env.REACT_APP_SERVER_URL;

const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(null);
  const [user, setUser] = useState(null);

  const checkLoginState = useCallback(async () => {
    try {
      const { data: { loggedIn: logged_in, user }} = await axios.get(`${serverUrl}/auth/logged_in`);
      setLoggedIn(logged_in);
      user && setUser(user);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    checkLoginState();
  }, [checkLoginState]);

  return (
    <AuthContext.Provider value={{ loggedIn, checkLoginState, user }}>
      {children}
    </AuthContext.Provider>
  );
}

const Dashboard = () => {
  const { user, loggedIn, checkLoginState } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data: { posts } } = await axios.get(`${serverUrl}/user/posts`);
        setPosts(posts);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchEmails = async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/user/messages`, {
          headers: { 'Authorization': `Bearer ${user.token}` },
          withCredentials: true,
        });
        console.log("Email Messages Data:", data);
        if (data && data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (loggedIn === true) {
      fetchPosts();
      fetchEmails();
    }
  }, [loggedIn, user.token]);

  const handleLogout = async () => {
    try {
      await axios.post(`${serverUrl}/auth/logout`);
      checkLoginState();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#ffffff' }}>
      <div className="text-center">
        <h3 className="my-3">Testing Authorization with OAuth2 Only using Auth Code</h3>
        <Card className="mb-4 mx-auto" style={{ maxWidth: '350px' }}>
          {user?.picture && <Card.Img variant="top" src={user?.picture} className="mx-auto" style={{ maxWidth: '100px', borderRadius: '50%' }} />}
          <Card.Body>
            <Card.Title>{user?.name}</Card.Title>
            <Card.Text>
              {user?.email}
            </Card.Text>
          </Card.Body>
        </Card>
        {isLoading ? (
          <div className="my-3">Loading...</div>
        ) : (
          <>
            <h4 className="my-3">Email Messages</h4>
            {messages.length > 0 ? (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Number</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{message}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p>No messages to display</p>
            )}
          </>
        )}
        <div className="my-3">
          <Button variant="primary" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
    </Container>
  );
};


const Login = () => {
  const handleLogin = async () => {
    try {
      const { data: { url } } = await axios.get(`${serverUrl}/auth/url`);
      window.location.assign(url);
    } catch (err) {
      console.error(err);
    }
  }
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <h3 className="mb-4">Testing Authorization with OAuth2 Only using Auth Code</h3>
        <div>
          <Button variant="primary" onClick={handleLogin}>
            <Image src="https://seeklogo.com/images/G/google-2015-logo-65BBD07B01-seeklogo.com.png" alt="Google Logo" className="google-logo" /> Login with Google
          </Button>
        </div>
      </div>
    </Container>
  );
}

const Callback = () => {
  const called = useRef(false);
  const { checkLoginState, loggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      if (loggedIn === false) {
        try {
          if (called.current) return;
          called.current = true;
          const res = await axios.get(`${serverUrl}/auth/token${window.location.search}`);
          console.log('response: ', res);
          checkLoginState();
          navigate('/');
        } catch (err) {
          console.error(err);
          navigate('/');
        }
      } else if (loggedIn === true) {
        navigate('/');
      }
    })();
  }, [checkLoginState, loggedIn, navigate])
  return <></>
};

const Home = () => {
  const { loggedIn } = useContext(AuthContext);
  if (loggedIn === true) return <Dashboard />;
  if (loggedIn === false) return <Login />
  return <></>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/auth/callback',
    element: <Callback />,
  }
]);

function App() {
  return (
    <div className="App" style={{ background: '#ffffff', minHeight: '100vh' }}>
      <header className="App-header">
        <AuthContextProvider>
          <RouterProvider router={router} />
        </AuthContextProvider>
      </header>
    </div>
  );
}

export default App;
