export type GoRestUserGender = 'male' | 'female';
export type GoRestUserStatus = 'active' | 'inactive';

export interface GoRestUserDto {
  id: number;
  name: string;
  email: string;
  gender: GoRestUserGender;
  status: GoRestUserStatus;
}

export type CreateGoRestUserPayload = Omit<GoRestUserDto, 'id'>;
export type UpdateGoRestUserPayload = Partial<CreateGoRestUserPayload>;
