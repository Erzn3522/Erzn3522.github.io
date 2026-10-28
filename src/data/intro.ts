// The intro: Q7, a wheeled survey robot, asks four questions. Each option has a pool of replies,
// one is picked at random per visit. Tones mix dry engineer, self-deprecating and dramatic AI.
export interface IntroOption {
  label: string;
  tag: string; // goes into the final visitor profile
  replies: string[];
}

export interface IntroQuestion {
  q: string;
  options: IntroOption[];
}

export const questions: IntroQuestion[] = [
  {
    q: 'Why are you here?',
    options: [
      {
        label: 'Hiring',
        tag: 'recruiter',
        replies: [
          'Recruiter detected. Raising the confidence threshold to 0.99 and hiding the bugs.',
          'Finally. Please do not open my first GitHub repos.',
          'A human with a budget. Initiating charm protocol.',
        ],
      },
      {
        label: 'Just curious',
        tag: 'curious',
        replies: [
          'Curiosity logged. Estimated time on site: 4 minutes, give or take 3 hours.',
          'Curiosity is a good start. That is how most of my experiments begin.',
          'Curious humans are my favourite. They rarely unplug me.',
        ],
      },
      {
        label: 'Clicked by accident',
        tag: 'accidental',
        replies: [
          'Accidental click registered. My model gave this a 3% chance. Retraining.',
          'Respect. I came here by accident too, and now I live here.',
          'There are no accidents. Only uncalibrated fingers.',
        ],
      },
    ],
  },
  {
    q: 'Apples, pears or oranges?',
    options: [
      {
        label: 'Apples',
        tag: 'apple aligned',
        replies: [
          'Apple selected. Depth 0.84 m. Ripeness: suspicious.',
          'Good. I spent months teaching a robot to find these.',
          'Correct answer. The pear people have been flagged.',
        ],
      },
      {
        label: 'Pears',
        tag: 'pear rebel',
        replies: [
          'Pear detected with 0.41 confidence. It looks like an apple that gave up.',
          'Bold. My harvester has never met a pear and I would like to keep it that way.',
          'Noted. Your file has been moved to a slightly colder server.',
        ],
      },
      {
        label: 'Oranges',
        tag: 'orange enjoyer',
        replies: [
          'Oranges are supported. The gripper says thank you.',
          'Oranges are fine. They roll, though. I have seen things.',
          'An orange enjoyer. The arm respects you.',
        ],
      },
    ],
  },
  {
    q: 'Which colour is closer: red or blue?',
    options: [
      {
        label: 'Red',
        tag: 'depth literate',
        replies: [
          'Correct. In this house red means near. Physicists, please look away.',
          'Right. I picked that colormap and I am still proud of it.',
          'Correct. You may now see in depth. Use it responsibly.',
        ],
      },
      {
        label: 'Blue',
        tag: 'sensor mounted backwards',
        replies: [
          'Blue is far. Like my deadlines.',
          'Interesting. Your depth sensor is mounted backwards. Happens to the best of us.',
          'Wrong, but confidently wrong. I can work with that.',
        ],
      },
      {
        label: 'Colours have no distance',
        tag: 'pedant',
        replies: [
          'Technically true. Insufferable, but true. You would pass code review.',
          'Ah, a pedant. You and my thesis advisor would get along.',
          'Correct and annoying. Calibration accuracy improved anyway.',
        ],
      },
    ],
  },
  {
    q: 'A robot drops an apple. Whose fault is it?',
    options: [
      {
        label: 'The robot',
        tag: 'strict with robots',
        replies: [
          'Harsh. The robot has been told and is now sulking at 30 fps.',
          'Fair. It was probably my code wearing a robot costume.',
          'The robot will remember this.',
        ],
      },
      {
        label: 'The camera',
        tag: 'blames the camera',
        replies: [
          'Classic. Always blame the camera. It cannot argue, it can only see.',
          'Correct. It is always calibration. It is always, always calibration.',
          'The camera saw you say that. Literally.',
        ],
      },
      {
        label: 'Gravity',
        tag: 'physics realist',
        replies: [
          'Gravity: undefeated since launch.',
          'Agreed. I have filed a ticket against physics.',
          'Finally, someone who reads the logs.',
        ],
      },
    ],
  },
];

/** What the surveyor says around the questions. One line is picked from each pool. */
export const robotName = 'Q7';
export const lines = {
  hello: [
    'Good day, human. I am Q7, survey unit. Do you have a minute?',
    'Hello. I am Q7. I have a clipboard and four questions. Shall we?',
    'Greetings. Q7, field surveys. This will take less time than a coffee.',
  ],
  yes: 'Sure',
  no: 'Not now',
  accepted: ['Excellent. Clipboard ready.', 'Splendid. Pen deployed.', 'Wonderful. Initiating paperwork.'],
  declined: [
    'Understood. I will wait here. Forever. Enjoy the portfolio.',
    'No problem. I have marked you as "mysterious".',
    'Fine. The clipboard and I will be fine. Probably.',
  ],
  profile: 'Survey complete. Your profile:',
  bye: [
    'Thank you for your cooperation. Rolling you in now.',
    'That is all. Thank you, human. Please enjoy the dots.',
    'Survey filed. Thank you. The portfolio is right behind me.',
  ],
};
