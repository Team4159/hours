import React, { useState } from 'react';

import { Box, Button, Flex, Heading, Image, Input, Stack } from '@chakra-ui/core';

export default function HomePage() {
  const [password, setPassword] = useState('');

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
        <Button variant='outline' variantColor='cardinalbotics.red'>Sign In</Button>
      </Stack>
      <Box flexGrow={6}/>
    </Stack>
  );
}
