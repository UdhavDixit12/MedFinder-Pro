import { MapPinOff } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import { Container, EmptyState } from '../components/ui/Misc.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <Container className="py-16">
      <EmptyState
        icon={MapPinOff}
        title="Page not found"
        action={
          <>
            <Button to="/">Go home</Button>
            <Button to="/hospitals" variant="outline">
              Search facilities
            </Button>
          </>
        }
      >
        The page you're looking for doesn't exist or has moved.
      </EmptyState>
    </Container>
  );
}
