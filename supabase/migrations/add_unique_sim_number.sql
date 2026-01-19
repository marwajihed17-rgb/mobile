-- Add unique constraints to sim_number fields in both tables

-- Add unique constraint to salam_customers.sim_number
ALTER TABLE salam_customers
ADD CONSTRAINT salam_customers_sim_number_key UNIQUE (sim_number);

-- Add unique constraint to mobily_customers.sim_number
ALTER TABLE mobily_customers
ADD CONSTRAINT mobily_customers_sim_number_key UNIQUE (sim_number);
