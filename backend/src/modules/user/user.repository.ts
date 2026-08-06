import { AppDataSource } from '../../core/database/data-source.js';
import { User } from './user.entity.js';

const repository = () => AppDataSource.getRepository(User);

export interface UpsertUserInput {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export const userRepository = {
  async findByGoogleId(googleId: string): Promise<User | null> {
    return repository().findOne({ where: { googleId } });
  },

  async findById(id: string): Promise<User | null> {
    return repository().findOne({ where: { id } });
  },

  async upsertByGoogleId(input: UpsertUserInput): Promise<User> {
    const existing = await repository().findOne({ where: { googleId: input.googleId } });
    if (existing) {
      repository().merge(existing, input);
      return repository().save(existing);
    }
    return repository().save(repository().create(input));
  },
};
