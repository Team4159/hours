import React, { useEffect, useState, useRef } from 'react';

import {
  Box,
  Button,
  ButtonProps,
  Flex,
  Heading,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  PseudoBox,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  Text,
  Textarea,
  StatNumber
} from '@chakra-ui/core';

import moment from 'moment';
import 'moment-timezone';
import 'moment-duration-format';

moment.tz.setDefault('Atlantic/Azores');

type User = {
  name: string;
  password: string;
  signedIn: boolean;
  lastSignedIn: moment.Moment;
  totalTime: moment.Duration;
};

const getUserData = (password: string): Promise<Array<string>> => {
  return fetch('/api/src/endpoints/getuserdata.php?' + new URLSearchParams({
    password
  }))
    .then(res => res.json());
}

const signInOut = (password: string): Promise<string> => {
  return fetch('/api/src/endpoints/signin.php?' + new URLSearchParams({
    password
  }))
    .then(res => res.text());
}

const arrayToUser = (array: Array<string>): User => ({
  name: array[0],
  password: array[1],
  signedIn: array[2] == 'TRUE',
  lastSignedIn: moment.unix(parseInt(array[3])),
  totalTime: moment.duration(array[4], 'seconds')
});

const LoadButton: React.FC<ButtonProps & { onLoadStart: (callback: () => void) => void, innerRef?: React.Ref<HTMLButtonElement> }> = (
  { children, innerRef, isDisabled, onLoadStart, ...props }
) => {
  const [isLoading, setIsLoading] = useState(false);
  const callback = () => {
    setIsLoading(false);
  };

  return (
    <Button
      {...props}
      ref={innerRef}
      isDisabled={isLoading || isDisabled}
      onClick={e => {
        if (!isLoading) {
          setIsLoading(true);
          onLoadStart(callback);
        }
      }}
    >
      {isLoading ? 'Loading...' : children}
    </Button>
  );
};

export default function HomePage() {
  const [userData, setUserData] = useState<User>(null);
  const [currentTime, setCurrentTime] = useState(moment());

  const [password, setPassword] = useState('');
  const [writeUp, setWriteUp] = useState('');

  const [modalShown, setModalShown] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const signInButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const storedPassword = localStorage.getItem('password');
    if (storedPassword) {
      getUserData(storedPassword)
        .then(json => {
          if (json != null) {
            setUserData(arrayToUser(json));
          }
        });
    }
  }, []);
  useEffect(() => {
    if (userData && userData.signedIn) {
      const interval = setInterval(() => {
        setCurrentTime(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [userData && userData.signedIn]);

  return (
    <Stack height='100%' alignItems='center' spacing={5}>
      <Flex
        direction='row'
        alignSelf='stretch'
        justifyContent='center'
        backgroundColor='cardinalbotics.red.400'
        paddingY={3}
      >
        <Image src='/logo.png'/>
      </Flex>
      <Box flexGrow={1}/>
      <Heading fontSize='4xl' color='cardinalbotics.red.400'>Hour Tracker</Heading>
      <Stack alignItems='start' width={['80%', '65%', '50%']}>
        {
          !userData ? (
            <Box width='100%'>
              <Input
                isFullWidth
                variant='filled'
                placeholder='Password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => {
                  if (e.key == 'Enter') {
                    signInButtonRef.current.click();
                  }
                }}
                paddingY={6}
              />
            </Box>
          ) : (
            <Stack width='100%'>
              <Heading fontSize='3xl' color={userData.signedIn ? 'green.400' : 'red.400'}>
                {!userData.signedIn && 'Not '}Signed In
              </Heading>
              <Stack isInline>
                <Stat>
                  <StatLabel>Name</StatLabel>
                  <StatNumber>{userData.name}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Password</StatLabel>
                  <PseudoBox
                    backgroundColor='black'
                    _hover={{backgroundColor: 'transparent'}}
                    userSelect='none'
                    cursor='pointer'
                    transition='0.3s all'
                  >
                    <StatNumber>{userData.password}</StatNumber>
                  </PseudoBox>
                </Stat>
              </Stack>
              <Stat>
                <StatLabel>
                  {userData.signedIn ? 'Session' : 'Total'} Time
                </StatLabel>
                <StatNumber>
                  {(userData.signedIn ? moment.duration(Math.max(currentTime.diff(userData.lastSignedIn), 0)) : userData.totalTime).format('hh:mm:ss', {
                    minValue: 0,
                    trim: false
                  })}
                </StatNumber>
                <StatHelpText>
                  {userData.signedIn ?
                    `Total Time: ${userData.totalTime.format('hh:mm:ss', { trim: false })}` :
                    'Make sure to sign in if you\'re doing work!'}
                </StatHelpText>
              </Stat>
            </Stack>
          )
        }
        { errorMessage && <Text color='red.400'>{errorMessage}</Text> }
        <Stack isInline>
          { !userData || !userData.signedIn ? (
            <LoadButton
              variant='outline'
              variantColor='cardinalbotics.red'
              innerRef={ref => signInButtonRef.current = ref}
              onLoadStart={callback => {
                const passwordToUse = userData ? userData.password : password;  
                getUserData(passwordToUse)
                  .then(json => {
                    if (json != null) {
                      setErrorMessage('');
                      localStorage.setItem('password', passwordToUse)
                      const user = arrayToUser(json);
                      if (!user.signedIn) {
                        signInOut(passwordToUse)
                          .then(() => getUserData(passwordToUse))
                          .then(json => setUserData(arrayToUser(json)))
                          .catch(err => setErrorMessage(err.toString()))
                          .finally(callback);
                      } else {
                        setUserData(arrayToUser(json));
                        callback();
                      }
                    } else {
                      setErrorMessage('Unable to find any matching accounts');
                      callback();
                    }
                  })
                  .catch(err => {
                    setErrorMessage(err.toString());
                    callback();
                  });
              }}
            >
              Sign In
            </LoadButton>
          ) : (
            <Button
              variant='outline'
              variantColor='cardinalbotics.red'
              onClick={() => {
                setModalShown(true);
              }}
            >
              Sign Out
            </Button>
          ) }
          { userData && !userData.signedIn && (
            <Button
              variant='solid'
              variantColor='cardinalbotics.red'
              onClick={() => {
                const storedPassword = userData.password;
                setErrorMessage('');
                if (userData.signedIn) {
                  signInOut(storedPassword)
                    .catch(err => setErrorMessage(err.toString()));
                }
                localStorage.removeItem('password');
                setUserData(null);
              }}
            >
              Forget Password
            </Button>
          ) }
        </Stack>
      </Stack>
      <Box flexGrow={6}/>
      <Modal
        isCentered
        isOpen={modalShown}
        initialFocusRef={textAreaRef}
        onClose={(_, reason) => {
          if (reason != 'clickedOverlay') {
            setModalShown(false);
          }
        }}
      >
        <ModalOverlay/>
        <ModalContent rounded='md'>
          <ModalHeader>
            <Text>Write-Up</Text>
          </ModalHeader>
          <ModalCloseButton/>
          <ModalBody>
            <Stack alignItems='start'>
              <Textarea
                placeholder='Write about what you did today...'
                fontFamily='body'
                value={writeUp}
                onChange={e => setWriteUp(e.target.value)}
                ref={ref => textAreaRef.current = ref}
              />
              { modalErrorMessage && <Text color='red.400'>{modalErrorMessage}</Text> }
              <LoadButton
                variant='solid'
                variantColor='cardinalbotics.red'
                isDisabled={!writeUp}
                onLoadStart={callback => {
                  const storedPassword = userData.password;
                  setModalErrorMessage('');
                  signInOut(storedPassword)
                    .then(() => getUserData(storedPassword))
                    .then(json => {
                      setUserData(arrayToUser(json));
                      setWriteUp('');
                      setModalShown(false);
                    })
                    .catch(err => setModalErrorMessage(err.toString()))
                    .finally(callback);
                }}
              >
                Submit
              </LoadButton>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
