Backend service.

## How to Run

1. **Set up environment variables**:
   - Create a `.env` file in the root directory (use `.env.example` as template)
   - Add `firebaseServiceAccount.json` for authentication

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Migrate the database**:

   ```bash
   pnpm db:push
   ```

4. **Generate project files**:

   ```bash
   pnpm generate
   ```

   This command runs:
   - `db:generate` - Generates Prisma client
   - `doc:generate` - Generates API documentation and routes using TSOA
   - `api:generate` - Generates API client code
   - `format` - Formats the code using Biome

5. **Start development server**:
   ```bash
   pnpm dev
   ```
