import React, { useContext, useEffect, useState, useRef } from 'react';

import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Input,
  Modal,
  IModal,
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

import { action } from 'mobx';
import { useObserver, observer } from 'mobx-react';
import { UserContext } from '@/stores/UserStore';

import moment from 'moment';
import 'moment-timezone';
import 'moment-duration-format';

moment.tz.setDefault('Atlantic/Azores');

const Onboarding = () => {
  const userStore = useContext(UserContext);
  
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setLoading] = useState(false);

  return (
    <Stack
      as='form'
      width='100%'
      onSubmit={e => {
        e.preventDefault();
        setErrorMessage('');
        setLoading(true);
        userStore.password = password;
        userStore.fetchUserData(false)
          .then(user => {
            if (!user.signedIn) {
              return userStore.signInOut();
            }
          })
          .then(() => {})
          .catch(err => {
            setErrorMessage(err.toString());
            userStore.password = null;
          })
          .finally(() => setLoading(false));
      }}
      alignItems='start'
    >
      <Box width='100%'>
        <Input
          isFullWidth
          variant='filled'
          placeholder='Password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          paddingY={6}
        />
      </Box>
      {errorMessage && <Text color='red.400'>{errorMessage}</Text>}
      <Button
        variant='outline'
        variantColor='cardinalbotics.red'
        type='submit'
        isDisabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Sign In'}
      </Button>
    </Stack>
  );
}

const SignOutModal: React.FC<Omit<IModal, 'children'>> = ({ onClose, ...props }) => {
  const userStore = useContext(UserContext);

  const [isModalLoading, setModalLoading] = useState(false);
  const [writeUp, setWriteUp] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  return useObserver(() => (
    <Modal
      {...props}
      onClose={onClose}
      isCentered
      initialFocusRef={textAreaRef}
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
            <Button
              variant='solid'
              variantColor='cardinalbotics.red'
              isDisabled={!writeUp || isModalLoading}
              onClick={() => {
                setModalErrorMessage('');
                setModalLoading(true);
                userStore.signInOut()
                  .then(() => {
                    setWriteUp('');
                    onClose(null);
                  })
                  .catch(err => setModalErrorMessage(err.toString()))
                  .finally(() => setModalLoading(false));
              }}
            >
              {isModalLoading ? 'Loading...' : 'Submit'}
            </Button>
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  ));
}

const Account = observer(() => {
  const userStore = useContext(UserContext);

  const [currentTime, setCurrentTime] = useState(moment());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (userStore.userData.signedIn) {
      const interval = setInterval(() => {
        setCurrentTime(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [userStore.userData.signedIn]);

  return (
    <Stack width='100%'>
      <Heading fontSize='3xl' color={userStore.userData.signedIn ? 'green.400' : 'red.400'}>
        {!userStore.userData.signedIn && 'Not '}Signed In
      </Heading>
      <Stack isInline>
        <Stat>
          <StatLabel>Name</StatLabel>
          <StatNumber>{userStore.userData.name}</StatNumber>
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
            <StatNumber>{userStore.userData.password}</StatNumber>
          </PseudoBox>
        </Stat>
      </Stack>
      <Stat>
        <StatLabel>
          {userStore.userData.signedIn ? 'Session' : 'Total'} Time
        </StatLabel>
        <StatNumber>
          {
            (
              userStore.userData.signedIn ?
              moment.duration(Math.max(currentTime.diff(userStore.userData.lastSignedIn), 0)) :
              userStore.userData.totalTime
            ).format('hh:mm:ss', {
              minValue: 0,
              trim: false
            })
          }
        </StatNumber>
        <StatHelpText>
          {userStore.userData.signedIn ?
            `Total Time: ${userStore.userData.totalTime.format('hh:mm:ss', { trim: false })}` :
            'Make sure to sign in if you\'re doing work!'}
        </StatHelpText>
      </Stat>
      {errorMessage && <Text color='red.400'>{errorMessage}</Text>}
      <Stack isInline>
        <Button
          variant='outline'
          variantColor='cardinalbotics.red'
          isDisabled={isLoading}
          onClick={() => {
            setErrorMessage('');
            setLoading(true);
            if (!userStore.userData.signedIn) {
              userStore.signInOut()
                .catch(err => setErrorMessage(err.toString()))
                .finally(() => setLoading(false));
            } else {
              setIsModalOpen(true);
            }
          }}
        >
          {isLoading ? 'Loading...' : (userStore.userData.signedIn ? 'Sign Out' : 'Sign In')}
        </Button>
        { !userStore.userData.signedIn && (
          <Button
            variant='solid'
            variantColor='cardinalbotics.red'
            isDisabled={isLoading}
            onClick={action(() => {
              setErrorMessage('');
              userStore.forgetPassword();
            })}
          >
            Forget Password
          </Button>
        ) }
      </Stack>
      <SignOutModal
        isOpen={isModalOpen}
        onClose={(_, reason) => {
          if (reason != 'clickedOverlay') {
            setLoading(false);
            setIsModalOpen(false);
          }
        }}
      />
    </Stack>
  );
});

const HomePage = () => {
  const userStore = useContext(UserContext);

  return useObserver(() => (
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
        { !userStore.userData ? <Onboarding/> : <Account/> }
      </Stack>
      <Box flexGrow={6}/>
    </Stack>
  ));
}

export default HomePage;
