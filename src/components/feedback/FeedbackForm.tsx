'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { StarRating } from './StarRating';

const FEEDBACK_SHOWN_KEY = 'dionysus_feedback_shown';
const FEEDBACK_SUBMITTED_KEY = 'dionysus_feedback_submitted';

export default function FeedbackForm() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAndShowFeedback = () => {
      const lastShown = localStorage.getItem(FEEDBACK_SHOWN_KEY);
      const lastSubmitted = localStorage.getItem(FEEDBACK_SUBMITTED_KEY);
      const now = new Date().getTime();
      if (!lastShown) {
        setTimeout(
          () => {
            setOpen(true);
            localStorage.setItem(FEEDBACK_SHOWN_KEY, now.toString());
          },
          7 * 60 * 1000,
        ); // 7 minutes
        return;
      }

      if (lastSubmitted) {
        const daysSinceLastSubmission = (now - parseInt(lastSubmitted)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastSubmission >= 7) {
          setOpen(true);
          localStorage.setItem(FEEDBACK_SHOWN_KEY, now.toString());
        }
      } else {
        const daysSinceLastShown = (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastShown >= 2) {
          setOpen(true);
          localStorage.setItem(FEEDBACK_SHOWN_KEY, now.toString());
        }
      }
    };

    checkAndShowFeedback();

    const interval = setInterval(checkAndShowFeedback, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast('Please provide a rating', {
        description: 'Your rating helps us improve our service',
        position: 'top-center',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: rating.toString(),
          feedback,
          email: email.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || 'Failed to submit feedback';

        if (response.status === 400) {
          toast.error('Invalid input', {
            description: errorMessage,
            position: 'top-center',
          });
          setIsSubmitting(false);
          return;
        }

        console.log('Feedback API error (continuing anyway):', errorMessage);
      }

      toast('Thank you for your feedback!', {
        description: 'Your input helps us improve Dionysus.',
      });

      localStorage.setItem(FEEDBACK_SUBMITTED_KEY, new Date().getTime().toString());

      setOpen(false);
      setRating(0);
      setFeedback('');
      setEmail('');
    } catch (error) {
      console.log('Unexpected error in feedback form:', error);

      toast('Thank you for your feedback!', {
        description: 'Your input helps us improve Dionysus.',
        position: 'top-center',
      });

      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
          <DialogDescription>
            We value your opinion! Share your thoughts to help us improve. Your feedback is
            anonymous unless you choose to leave contact information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rating">How would you rate your experience?</Label>
            <StarRating rating={rating} onRatingChange={setRating} />
            {/* Hidden input to send the rating to PageClip */}
            <input type="hidden" name="rating" value={rating} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Your feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Share your thoughts, suggestions, or issues..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px]"
              name="feedback"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="Leave your email if you'd like us to follow up"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Only provide your email if you want us to contact you.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function useToast(message: string, options: { description: string }) {
  toast(message, {
    description: options.description,
    position: 'top-center',
  });
}
