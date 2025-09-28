import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type Episode = {
  id: string;
  title: string;
  tags: string[];
  sharing?: "public" | "private"; // <-- ajouté
};

const dataFile = path.join(process.cwd(), 'data', 'episodes.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const data: Episode[] = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

    // Filtrer uniquement les épisodes publics
    const publicEpisodes = data.filter(ep => ep.sharing === "public" || ep.sharing === undefined);

    res.status(200).json(publicEpisodes);
  } else if (req.method === 'POST') {
    const { id, tags } = req.body as { id: string; tags: string[] };
    const data: Episode[] = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const episode = data.find(e => e.id === id);

    if (episode) {
      episode.tags = tags;
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      res.status(200).json({ message: 'Tags updated' });
    } else {
      res.status(404).json({ message: 'Episode not found' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
