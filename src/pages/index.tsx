import React, { Fragment, useContext, useEffect, useState, useRef } from 'react';

import {
  Box,
  Button,
  Flex,
  FlexProps,
  Heading,
  IconButton,
  Image,
  Input,
  Modal,
  IModal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  StackProps,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/core';

import { action } from 'mobx';
import { useObserver, observer } from 'mobx-react';
import { UserContext } from '@/stores/UserStore';
import { TimeContext } from '@/stores/TimeStore';

import moment from 'moment';
import 'moment-timezone';
import 'moment-duration-format';

import Session from '@/models/Session';

const HELP_TEXT = 'If this error was unexpected, contact Kai or Ling on Slack.';

const Onboarding = () => {
  const userStore = useContext(UserContext);
  
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setLoading] = useState(false);

  const toast = useToast();

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
              return userStore.signIn();
            } else {
              userStore.userData = user;
            }
          })
          .then(() => toast({
            title: 'Signed in.',
            description: 'You\'ve  successfully been signed in and your password has been remembered.',
            status: 'success',
            duration: 2500
          }))
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
      {errorMessage && (
        <Text color='red.400'>
          {errorMessage}<br/>
          {HELP_TEXT}
        </Text>
      )}
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

  const toast = useToast();

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
                userStore.signOut(writeUp)
                  .then(() => {
                    setWriteUp('');
                    onClose(null);
                    toast({
                      title: 'Signed out.',
                      description: 'You\'ve successfully been signed out and your session has been saved.',
                      status: 'success',
                      duration: 2.5
                    });
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

const Account: React.FC<StackProps> = observer(props => {
  const userStore = useContext(UserContext);
  const timeStore = useContext(TimeContext);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isChangingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const toast = useToast();

  return (
    <Stack rounded='lg' padding={6} backgroundColor='white' {...props}>
      <Heading fontSize='4xl' color={userStore.userData.signedIn ? 'green.400' : 'red.400'}>
        {!userStore.userData.signedIn && 'Not '}Signed In
      </Heading>
      <Stack isInline>
        <Stat>
          <StatLabel>Name</StatLabel>
          <StatNumber>{userStore.userData.name}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Password</StatLabel>
          <Stack isInline alignItems='center'>
            {isChangingPassword ? (
              <Input
                size='sm'
                height='30px'
                variant='flushed'
                _focus={{ borderBottomColor: 'cardinalbotics.red.400' }}
                fontFamily='body'
                fontSize='xl'
                fontWeight='bold'
                placeholder='New Password'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            ): (
              <StatNumber>
                {userStore.userData.password}
              </StatNumber>
            )}
            <IconButton
              size='xs'
              variant='outline'
              variantColor='cardinalbotics.red'
              aria-label={isChangingPassword ? 'Check' : 'Edit'}
              icon={isChangingPassword ? 'check' : 'edit'}
              onClick={() => {
                if (isChangingPassword) {
                  toast({
                    title: 'Password changed.',
                    description: 'You\'ve successfully changed your password.',
                    status: 'success',
                    duration: 2500
                  });
                }
                setChangingPassword(!isChangingPassword);
              }}
            />
          </Stack>
        </Stat>
      </Stack>
      <Stat flexGrow={0}>
        <StatLabel>
          {userStore.userData.signedIn ? 'Session' : 'Total'} Time
        </StatLabel>
        <StatNumber>
          {
            (
              userStore.userData.signedIn ?
              moment.duration(Math.max(timeStore.currentTime.diff(userStore.userData.lastTime), 0)) :
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
      {errorMessage && (
        <Text color='red.400'>
          {errorMessage}<br/>
          {HELP_TEXT}
        </Text>
      )}
      <Stack isInline>
        <Button
          variant='outline'
          variantColor='cardinalbotics.red'
          isDisabled={isLoading}
          onClick={() => {
            setErrorMessage('');
            setLoading(true);
            if (!userStore.userData.signedIn) {
              userStore.signIn()
                .then(() => toast({
                  title: 'Signed in.',
                  description: 'You\'ve successfully been signed in.',
                  status: 'success',
                  duration: 2500
                }))
                .catch(err => setErrorMessage(err.toString()))
                .finally(() => setLoading(false));
            } else {
              setModalOpen(true);
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
              toast({
                title: 'Password forgotten.',
                description: 'You\'ve successfully forgotten your password and you will no longer be automatically signed in.',
                status: 'success',
                duration: 2500
              });
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
            setModalOpen(false);
          }
        }}
      />
    </Stack>
  );
});

const SessionTableRow: React.FC<FlexProps & { session: Session }> = ({ session, ...props }) => {
  const [isExpanded, setExpanded] = useState(false);

  return (
    <Flex direction='row' {...props}>
      <Text flexBasis='10%' paddingX={6} paddingY={2}>
        {session.date.clone().subtract(session.time).format('MMM Do')}
      </Text>
      <Text flexBasis='20%' paddingX={6} paddingY={3}>
        {session.date.clone().subtract(session.time).format('LT')} - {session.date.format('LT')}
      </Text>
      <Text flexBasis='70%' paddingX={6} paddingY={2}>
        {session.did.length > 250 ? (
          <Fragment>
            {!isExpanded ? session.did.slice(0, 250).concat('...') : session.did}
            <Text cursor='pointer' color='cardinalbotics.red.400' onClick={() => setExpanded(!isExpanded)}>
              {isExpanded ? 'Collpase' : 'Expand'}
            </Text>
          </Fragment>
        ) : session.did}
      </Text>
    </Flex>
  )
}

const SessionsTable: React.FC<FlexProps> = props => {
  const userStore = useContext(UserContext);

  return useObserver(() => (
    <Flex direction='column' {...props}>
      <Flex direction='row' backgroundColor='gray.300' fontWeight='bold'>
        <Text flexBasis='10%' paddingX={6} paddingY={3}>
          Date
        </Text>
        <Text flexBasis='20%' paddingX={6} paddingY={3}>
          Time
        </Text>
        <Text flexBasis='70%' paddingX={6} paddingY={3}>
          What Did You Do?
        </Text>
      </Flex>
      {userStore.userData.sessions.reverse().map((session, idx) => (
        <SessionTableRow
          key={idx}
          session={session}
          backgroundColor={idx % 2 == 0 ? 'gray.100' : 'white'}
        />
      ))}
    </Flex>
  ));
}

const OtherUsersTable: React.FC<FlexProps> = props => {
  const userStore = useContext(UserContext);
  const timeStore = useContext(TimeContext);

  return useObserver(() => (
    <Flex direction='column' {...props}>
      <Flex direction='row' backgroundColor='gray.300' fontWeight='bold'>
        <Text flexBasis='50%' paddingX={6} paddingY={3}>
          Name
        </Text>
        <Text flexBasis='50%' paddingX={6} paddingY={3}>
          Time In
        </Text>
      </Flex>
      {
        userStore.otherUserData
          .filter(user => user.signedIn && user.name != userStore.userData.name)
          .sort((a, b) => a.lastTime.diff(b.lastTime))
          .map((user, idx) => (
            <Flex key={idx} direction='row' backgroundColor={idx % 2 == 0 ? 'gray.100' : 'white'}>
              <Text flexBasis='50%' paddingX={6} paddingY={2}>
                {user.name}
              </Text>
              <Text flexBasis='50%' paddingX={6} paddingY={3}>
                {
                  moment.duration(timeStore.currentTime.diff(user.lastTime)).format('hh:mm:ss', {
                    minValue: 0,
                    trim: false
                  })
                }
              </Text>
            </Flex>
          ))
      }
    </Flex>
  ));
}

const HomePage = () => {
  const userStore = useContext(UserContext);

  return useObserver(() => (
    <Stack minHeight='100%' alignItems='center' spacing={5} backgroundColor='gray.200'>
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
      {!userStore.userData && <Heading fontSize='4xl' color='cardinalbotics.red.400'>Hour Tracker</Heading>}
      <Stack alignItems='start' width={!userStore.userData ? ['80%', '65%', '50%'] : ['90%', '80%']}>
        {!userStore.userData ? <Onboarding/> : (
          <Stack width='100%' spacing={10}>
            <Account/>
            <Tabs size='lg' variantColor='cardinalbotics.red' borderBottomColor='gray.300'>
              <TabList>
                <Tab marginRight={3}>Your Past Sessions</Tab>
                <Tab>Other Active Members</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <SessionsTable marginBottom={10}/>
                </TabPanel>
                <TabPanel>
                  <OtherUsersTable/>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Stack>
        )}
      </Stack>
      <Box flexGrow={6}/>
    </Stack>
  ));
}

export default HomePage;
