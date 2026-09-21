export interface GoRestCommentDto {
  id: number;
  post_id: number;
  name: string;
  email: string;
  body: string;
}

// post_id is supplied via the nested endpoint path, not the request body — see
// GoRestComment.create in api/GoRestComment.api.ts.
export type CreateGoRestCommentPayload = Omit<GoRestCommentDto, 'id' | 'post_id'>;
