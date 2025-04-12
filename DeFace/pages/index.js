import { useState } from 'react';

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setLoading(true);
    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Image Classification</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" name="image" accept="image/*" required />
        <button type="submit" disabled={loading}>
          {loading ? 'Classifying...' : 'Classify'}
        </button>
      </form>
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}