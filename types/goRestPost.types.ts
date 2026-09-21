export interface GoRestPostDto {
  id: number;
  user_id: number;
  title: string;
  body: string;
}

export type CreateGoRestPostPayload = Omit<GoRestPostDto, 'id'>;
