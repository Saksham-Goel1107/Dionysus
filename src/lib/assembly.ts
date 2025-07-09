import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

function msToTime(ms: number) {
  const seconds = ms / 1000;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const processMeeting = async (meetingUrl: string) => {
  const transcript = await client.transcripts.transcribe({
    audio: meetingUrl,
    auto_chapters: true,
    speaker_labels: true,
  });

  const summaries =
    transcript.chapters?.map((chapter) => ({
      start: msToTime(chapter.start),
      end: msToTime(chapter.end),
      gist: chapter.gist,
      headline: chapter.headline,
      summary: chapter.summary,
    })) || [];

  if (!transcript.text) throw new Error('No Transcript found');

  // Format transcript with speaker labels if available
  let formattedTranscript = transcript.text;
  if (transcript.utterances && transcript.utterances.length > 0) {
    formattedTranscript = transcript.utterances
      .map((utterance) => {
        const speaker = utterance.speaker || 'Speaker';
        const text = utterance.text || '';
        return `${speaker}: ${text}\n`;
      })
      .join('\n');
  }

  return {
    summaries,
    transcript: formattedTranscript,
  };
};
